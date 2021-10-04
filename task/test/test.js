const puppeteer = require('puppeteer');
const path = require('path');
const hs = require('hs-test-web');
const fs = require("fs");
const rimraf = require("rimraf");

const workingDir = path.resolve(__dirname, '../src');
const pagePath = 'file://' + path.resolve(__dirname, workingDir + '/index.html');


const sleep = (ms) => new Promise(res => setTimeout(res, ms));

async function stageTest() {
    const browser = await puppeteer.launch({
        headless: false,
        defaultViewport: null,
        args: ['--start-maximized', '--disable-infobar'],
        ignoreDefaultArgs: ['--enable-automation']
    });

    const page = await browser.newPage();
    await page.goto(pagePath);
    await page._client.send('Page.setDownloadBehavior', {
        behavior: 'allow',
        downloadPath: workingDir + path.sep + "downloads"
    });

    page.on('console', msg => console.log(msg.text()));

    await sleep(1000);

    rimraf.sync(workingDir + '/downloads');

    let result = await hs.testPage(page,
        // Test #1
        () => {
            const nodes = document.getElementsByClassName("title");

            if (nodes.length !== 1) {
                return hs.wrong("There should be one element with class 'title', found " + nodes.length + "!")
            }

            const titleDiv = nodes[0];

            if (titleDiv.textContent !== 'Case Converter') {
                return hs.wrong("The title name should be 'Case Converter', but found " + titleDiv.textContent.trim())
            }

            return hs.correct()
        },

        // Test #2
        () => {
            const nodes = document.getElementsByTagName("textarea");

            if (nodes.length !== 1) {
                return hs.wrong("There should be one 'textarea' element, found " + nodes.length + "!")
            }

            this.textArea = nodes[0];

            if (this.textArea.textContent.trim() !== '') {
                return hs.wrong("TextArea should be empty by default!")
            }

            return hs.correct()
        },

        // Test #3
        () => {
            this.upperCaseButton = document.querySelector("button#upper-case")
            this.lowerCaseButton = document.querySelector("button#lower-case")
            this.properCaseButton = document.querySelector("button#proper-case")
            this.sentenceCaseButton = document.querySelector("button#sentence-case")
            this.saveTextFileButton = document.querySelector("button#save-text-file")

            if (this.upperCaseButton === null) {
                return hs.wrong("Can't find a button with '#upper-case' id!")
            }

            if (this.lowerCaseButton === null) {
                return hs.wrong("Can't find a button with '#lower-case' id!")
            }

            if (this.properCaseButton === null) {
                return hs.wrong("Can't find a button with '#proper-case' id!")
            }

            if (this.sentenceCaseButton === null) {
                return hs.wrong("Can't find a button with '#sentence-case' id!")
            }

            if (this.saveTextFileButton === null) {
                return hs.wrong("Can't find a button with '#save-text-file' id!")
            }

            return hs.correct()
        },

        // Test #4
        () => {

            this.textArea.value = 'Lorem Ipsum is simply dummy text of the printing and typesetting industry.' +
                ' Lorem Ipsum has been the industry\'s standard dummy text ever since the 1500s,' +
                ' when an unknown printer took a galley of type and scrambled it to make a type specimen book.'

            const upperCaseText = 'LOREM IPSUM IS SIMPLY DUMMY TEXT OF THE PRINTING AND TYPESETTING INDUSTRY.' +
                ' LOREM IPSUM HAS BEEN THE INDUSTRY\'S STANDARD DUMMY TEXT EVER SINCE THE 1500S,' +
                ' WHEN AN UNKNOWN PRINTER TOOK A GALLEY OF TYPE AND SCRAMBLED IT TO MAKE A TYPE SPECIMEN BOOK.'

            this.upperCaseButton.click()

            if (this.textArea.value !== upperCaseText) {
                return hs.wrong("After clicking on 'Upper Case' button your text is wrong!")
            }

            const lowerCaseText = 'lorem ipsum is simply dummy text of the printing and typesetting industry.' +
                ' lorem ipsum has been the industry\'s standard dummy text ever since the 1500s,' +
                ' when an unknown printer took a galley of type and scrambled it to make a type specimen book.'

            this.lowerCaseButton.click()

            if (this.textArea.value !== lowerCaseText) {
                return hs.wrong("After clicking on 'Lower Case' button your text is wrong!")
            }

            const properCase = 'Lorem Ipsum Is Simply Dummy Text Of The Printing And Typesetting Industry.' +
                ' Lorem Ipsum Has Been The Industry\'s Standard Dummy Text Ever Since The 1500s,' +
                ' When An Unknown Printer Took A Galley Of Type And Scrambled It To Make A Type Specimen Book.'

            this.properCaseButton.click()

            if (this.textArea.value !== properCase) {
                return hs.wrong("After clicking on 'Proper Case' button your text is wrong!")
            }

            const sentenceCase = 'Lorem ipsum is simply dummy text of the printing and typesetting industry.' +
                ' Lorem ipsum has been the industry\'s standard dummy text ever since the 1500s,' +
                ' when an unknown printer took a galley of type and scrambled it to make a type specimen book.'

            this.sentenceCaseButton.click()

            if (this.textArea.value !== sentenceCase) {
                return hs.wrong("After clicking on 'Sentence Case' button your text is wrong!")
            }

            return hs.correct()
        },

        // Test #5
        async () => {
            this.saveTextFileButton.click()

            const delay = ms => new Promise(res => setTimeout(res, ms));
            await delay(2000);

            return hs.correct()
        }
    );

    if (result['type'] === 'wrong') {
        await browser.close();
        return result;
    }

    result = await hs.test(
        () => {

            const correctTextFileContent = 'Lorem ipsum is simply dummy text of the printing and typesetting industry.' +
                ' Lorem ipsum has been the industry\'s standard dummy text ever since the 1500s,' +
                ' when an unknown printer took a galley of type and scrambled it to make a type specimen book.'

            const filePath = workingDir + `${path.sep}downloads${path.sep}text.txt`;

            if (!fs.existsSync(filePath)) {
                return hs.wrong("Looks like you didn't download a text file named 'text.txt', after clicking on 'Save Text File' button")
            }

            let fileContent = fs.readFileSync(filePath, "utf8");

            if (fileContent !== correctTextFileContent) {
                return hs.wrong("Content of downloaded file is wrong!")
            }

            return hs.correct()
        }
    )

    rimraf.sync(workingDir + '/downloads');

    await browser.close();
    return result;
}

jest.setTimeout(30000);
test("Test stage", async () => {
        let result = await stageTest();
        if (result['type'] === 'wrong') {
            fail(result['message']);
        }
    }
);
