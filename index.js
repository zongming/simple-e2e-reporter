const fs = require("fs");
const path = require("path");
const Report = require('./report');

class Reporter {
    constructor(options) {
        this.savePath = options.savePath;
        this.reportFileName = options.reportFileName;
    }

    jasmineStarted(suiteInfo) {
        this.results = {};
        this.orders = [];
        this.startTime = new Date();
    }

    suiteStarted(result) {
        this.orders.push(result.id);
    }

    suiteDone(result) {
        this.orders.push(result.id);
        this.results[result.id] = result;
    }

    specStarted(result) {
        this.orders.push(result.id);
    }

    specDone(result) {
        this.orders.push(result.id);
        this.results[result.id] = result;
        this.endTime = new Date();

        if (result.status === 'failed') {
            browser.getCapabilities().then(() => {
                console.log('Take screenshot for failed case: ' + result.id);

                browser.takeScreenshot().then((png) => {
                    const stream = fs.createWriteStream(path.resolve(this.savePath, 'screenshots', result.id + '.png'));
                    stream.write(new Buffer(png, 'base64'));
                    stream.end();
                    console.log('Take screeshot success');
                }, (err) => {
                    console.log('Take screeshot failed: ' + err);
                });
            });
        }
    }

    jasmineDone() {
        this.treeNode = this.createTree(this.orders);
        this.fillResults(this.treeNode);

        this.deleteParent(this.treeNode);

        this.writeToJSON(JSON.stringify(this.treeNode));

        browser.getCapabilities().then((caps) => {
            const browserName = caps.get('browserName');
            const browserVersion = caps.get('version');

            const report = new Report().generateReport(this.treeNode, {
                browserName,
                browserVersion,
                startTime: this.startTime,
                endTime: this.endTime
            });

            this.writeToReport(report);
        });
    }

    readFile(filename) {
        return fs.readFileSync(filename, 'utf-8');
    }

    fillResults(tree) {
        this.fillResult(tree);

        for (let i = 0; i < tree.children.length; i++) {
            this.fillResults(tree.children[i]);
        }
    }

    deleteParent(tree) {
        delete tree.parent;

        for (let i = 0; i < tree.children.length; i++) {
            this.deleteParent(tree.children[i]);
        }
    }

    fillResult(node) {
        const nodeID = node.id;
        const result = this.results[nodeID];
        if (result) {
            const failed = result['failedExpectations'];
            if (failed && failed.length) {
                failed.forEach(f => {
                    f.actual = f.actual.toString();
                })
            }
            
            node.result = result;

            if (!node.isSuite) {
                let p = node.parent;
                while (p && p.isSuite) {
                    switch (result.status) {
                        case 'passed':
                            p.passed++;
                            break;
                        case 'failed':
                            p.failed++;
                            break;
                        case 'disabled':
                            p.skipped++;
                            break;
                    }
                    p = p.parent;
                }
            }
        }
    }

    createTree(orders) {
        const suites = {
            id: 'root',
            parent: undefined,
            isSuite: true,
            children: [],
            passed: 0,
            failed: 0,
            skipped: 0
        };
        let pointer = suites;

        for (let i = 0; i < orders.length; i++) {
            const x = orders[i];
            const parent = pointer.parent;

            if (x === pointer.id) {
                parent.children.push(pointer);
                pointer = parent;
            } else {
                const node = {
                    id: x,
                    parent: pointer,
                    isSuite: this.isSuite(x),
                    passed: 0,
                    failed: 0,
                    skipped: 0,
                    children: []
                };
                pointer = node;
            }
        }
        return suites;
    }

    isSuite(id) {
        return id.indexOf('suite') === 0;
    }

    writeToJSON(text) {
        const filename = 'report.json';
        const filePath = path.join(this.savePath || __dirname, filename);
        const json = fs.openSync(filePath, "w");
        fs.writeSync(json, text, 0);
        fs.closeSync(json);
    }

    writeToReport(text) {
        const filename = this.reportFileName || 'report.html';
        const filePath = path.join(this.savePath || __dirname, filename);
        const html = fs.openSync(filePath, "w");
        fs.writeSync(html, text, 0);
        fs.closeSync(html);
    }
}

module.exports = Reporter;