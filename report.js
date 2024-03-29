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
    
        this.emailTemplate = _.template(
            this.readFile(path.resolve(__dirname, 'template', 'summary.tmpl'))
        );
    }

    readFile(filename) {
        return fs.readFileSync(filename, 'utf-8');
    }

    generateReport(treeNode, config = {}) {
        const {startTime, endTime, browserName, browserVersion, date} = config;
    
        const duration = this.getDuration(startTime, endTime);
        
        const report = this.indexTemplate({
            passed: treeNode.passed,
            failed: treeNode.failed,
            skipped: treeNode.skipped,
            date,
            duration,
            browserName,
            browserVersion,
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
    
    generateSummary(treeNode, config = {}) {
        const {startTime, endTime, browserName, browserVersion, date} = config;
    
        const duration = this.getDuration(startTime, endTime);
    
        const report = this.emailTemplate({
            passed: treeNode.passed,
            failed: treeNode.failed,
            skipped: treeNode.skipped,
            errorList: this.generateErrorList(treeNode),
            date,
            duration,
            browserName,
            browserVersion,
        });
        return report;
    }
    
    getDuration(startTime, endTime) {
        let duration = '';
        if (startTime && endTime) {
            const totalSeconds = Math.floor((endTime - startTime) / 1000);
            const hours = Math.floor(totalSeconds / 3600);
            const minutes = Math.floor(totalSeconds % 3600 / 60);
            
            if (hours) {
                duration += `${hours} hours`;
            }
            if (minutes) {
                duration += `${minutes} minutes`;
            }
        }
        return duration;
    }
    
    generateErrorList(tree) {
        let list = [];
        for (let i = 0; i < tree.children.length; i++) {
            const c = tree.children[i];
            if (c.isSuite) {
                list = [...this.generateErrorList(c), ...list];
            } else if(c.result.status === 'failed') {
                const r = c.result;
                list.push({
                    fullName: c.result.fullName,
                    message: r.failedExpectations && r.failedExpectations[0] && r.failedExpectations[0].message
                });
            }
        }
        return list;
    }

    writeToReport(text) {
        const filename = 'report.html';
        const filePath = path.join(filename);
        const html = fs.openSync(filePath, "w");
        fs.writeSync(html, text, 0);
        fs.closeSync(html);
    }

    writeToSummary(text) {
        const filename = 'summary.html';
        const filePath = path.join(filename);
        const html = fs.openSync(filePath, "w");
        fs.writeSync(html, text, 0);
        fs.closeSync(html);
    }
}

// const startTime = new Date(1571628330949);
// const endTime = new Date(1571629330949);
// const suites = require('./report.json');
// const report = new Report();
// const config = {
//     date: new Date(),
//     duration: '1 hour 2 min',
//     browserName: 'chrome',
//     browserVersion: '75',
//     startTime,
//     endTime
// };
// report.writeToReport(report.generateReport(suites, config));
// report.writeToSummary(report.generateSummary(suites, config));

module.exports = Report;