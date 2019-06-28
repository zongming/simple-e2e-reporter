const fs = require("fs");
const path = require("path");
const Report = require('./report');

class Reporter {
    constructor(options) {
        this.savePath = options.savePath;
    }

    jasmineStarted(suiteInfo) {
        this.results = {};
        this.orders = [];
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
    }

    jasmineDone() {
        this.treeNode = this.createTree(this.orders);
        this.fillResults(this.treeNode);
        this.writeToJSON(JSON.stringify(this.treeNode));

        const report = new Report().generateReport(this.treeNode);
        this.writeToReport(report);
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

    fillResult(node) {
        const nodeID = node.id;
        const result = this.results[nodeID];
        if (result) {
            node.result = result;
        }
        delete node.parent;
    }

    createTree(orders) {
        const suites = {
            id: 'root',
            parent: undefined,
            children: []
        };
        let pointer = suites;

        for (let i = 0; i < orders.length; i++) {
            const x = orders[i];

            if (x === pointer.id) {
                pointer.parent.children.push(pointer);
                pointer = pointer.parent;
            } else {
                const node = {
                    id: x,
                    parent: pointer,
                    isSuite: this.isSuite(x),
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
        const filename = 'report.html';
        const filePath = path.join(this.savePath || __dirname, filename);
        const html = fs.openSync(filePath, "w");
        fs.writeSync(html, text, 0);
        fs.closeSync(html);
    }
}

module.exports = Reporter;