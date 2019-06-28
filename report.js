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

}

// const suites = require('./report.json');
// new Report().generateReport(suites);

module.exports = Report;