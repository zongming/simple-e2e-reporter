class WebStudioE2EReporter {

    constructor(options) {

    }

    jasmineStarted(suiteInfo) {
        this.results = {};
        this.orders = [];
    }

    suiteStarted(result) {
        this.orders.push(result.id);
        console.log(`================suiteStarted==============`);
        console.log(`${result.id}`);
        // console.log('Spec started: ' + result.description + ' whose full description is: ' + result.fullName);
    }

    suiteDone(result) {
        this.orders.push(result.id);
        this.results[result.id] = result;
        console.log(`================suiteDone==============`);
        console.log(`${result.id}`);
        // console.log('Suite: ' + result.description + ' was ' + result.status);
        // for(let i = 0; i < result.failedExpectations.length; i++) {
        //     console.log('AfterAll ' + result.failedExpectations[i].message);
        //     console.log(result.failedExpectations[i].stack);
        // }
    }

    specStarted(result) {
        this.orders.push(result.id);
        console.log(`================specStarted==============`);
        console.log(`${result.id}`);
    }

    specDone(result) {
        this.orders.push(result.id);
        this.results[result.id] = result;
        console.log(`================specDone==============`);
        console.log(`${result.id}`);
        // console.log('Spec: ' + result.description + ' was ' + result.status);
        // for(let i = 0; i < result.failedExpectations.length; i++) {
        //     console.log('Failure: ' + result.failedExpectations[i].message);
        //     console.log(result.failedExpectations[i].stack);
        // }
        // console.log(result.passedExpectations.length);
    }

    jasmineDone() {
        this.treeNode = this.createTree(this.orders);
        this.fillResults(this.treeNode);
        console.log(JSON.stringify(this.treeNode));
    }

    fillResults(tree) {
        this.fillTreeNode(tree);

        for (let i = 0; i < tree.children.length; i++) {
            this.fillResults(tree.children[i]);
        }
    }

    fillTreeNode(node) {
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
}

module.exports = WebStudioE2EReporter;