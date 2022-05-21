const fcl = require('@onflow/fcl');
const sdk = require('@onflow/sdk');

let blockHeightToTimestamp = {};
let txCache = {};

const splitChunks = ([...array], size = 1) => {
    return array.reduce((acc, _value, index) => index % size ? acc : [...acc, array.slice(index, index + size)], []);
}

class Flow {
    constructor() {
        const flowAccessNodeUrl = 'https://access-mainnet-beta.onflow.org';
        // const flowAccessNodeUrl = 'https://flow-access-mainnet.portto.io';
        fcl.config().put('accessNode.api', flowAccessNodeUrl);
    }

    async getCurrentBlock() {
        const isSealed = true;
        const blockResponse = await fcl.send([fcl.getBlock(isSealed)]);
        const block = await fcl.decode(blockResponse);
        return block.height;
    }

    async getEvents(fromBlock, toBlock) {
        const range = 240;
        let events = [];
        let curFromBlock = fromBlock;
        let curToBlock = curFromBlock + range - 1;
        while (true) {
            if (curToBlock > toBlock) curToBlock = toBlock;

            events = events.concat(await this.getEventsInner(curFromBlock, curToBlock));

            if (curToBlock >= toBlock) break;
            curFromBlock = curToBlock + 1;
            curToBlock = curFromBlock + range - 1;

            blockHeightToTimestamp = {};
        }
        return events;
    }

    async getEventsInner(fromBlock, toBlock) {
        const eventType = 'A.2d4c3caffbeab845.FLOAT.FLOATEventCreated';
        console.log(`getEvents: ${fromBlock} - ${toBlock}, event: ${eventType}`);
        const eventsResponse = await fcl.send(await sdk.build([sdk.getEventsAtBlockHeightRange(eventType, fromBlock, toBlock)]));
        if (!eventsResponse || !eventsResponse.events || eventsResponse.events.length === 0) return [];

        const blockHeights = {};
        const txIdToBlockHeight = eventsResponse.events.reduce((acc, e) => {
            blockHeights[e.blockHeight] = true;
            acc[e.transactionId] = e.blockHeight;
            return acc;
        }, {});

        const chunks = splitChunks(Object.keys(blockHeights), 10);
        for (const chunk of chunks) {
            await Promise.all(chunk.map(async (blockHeight) => {
                if (!blockHeightToTimestamp[blockHeight]) {
                    const blockResponse = await fcl.send(
                        sdk.build([
                            sdk.getBlock(),
                            sdk.atBlockHeight(blockHeight)
                        ])
                    );
                    const block = await fcl.decode(blockResponse);
                    blockHeightToTimestamp[blockHeight] = new Date(block.timestamp).toISOString();
                }
            }));
        }

        const events = await fcl.decode(eventsResponse);
        return events.map(e => {
            return {
                blockHeight: txIdToBlockHeight[e.transactionId],
                blockTimestamp: blockHeightToTimestamp[txIdToBlockHeight[e.transactionId]],
                ...e,
                ...e.data
            }
        });
    }

    async getTx(txId) {
        if (!txCache[txId]) {
            txCache[txId] = fcl.decode(await fcl.send([fcl.getTransaction(txId)]));
        }
        return txCache[txId];
    }
}

module.exports = new Flow();