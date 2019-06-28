const fs = require("fs");
const path = require("path");
const _ = require('lodash');

class Report {
    constructor() {
        this.indexTemplate = _.template(
            this.readFile(path.resolve(__dirname, 'template', 'index.tmpl'))
        );

        this.suiteTemplate = _.template(
            this.readFile(path.resolve(__dirname, 'template', 'suite.tmpl'))
        );
    }

    readFile(filename) {
        return fs.readFileSync(filename, 'utf-8');
    }

    generateReport(treeNode) {
        const report = this.indexTemplate({
            html: this.generateHtml(treeNode)
        });
        return report;
    }

    generateHtml(node) {
        return this.suiteTemplate({
            suite: Object.assign({}, node.result, node),
            children: node.children.map(n => this.generateHtml(n))
        });
    }

    // writeToReport(text) {
    //     const filename = 'report.html';
    //     const filePath = path.join(filename);
    //     const html = fs.openSync(filePath, "w");
    //     fs.writeSync(html, text, 0);
    //     fs.closeSync(html);
    // }
}

// const suites = require('./report.json');
// const report = new Report();
// report.writeToReport(report.generateReport(suites));

module.exports = Report;