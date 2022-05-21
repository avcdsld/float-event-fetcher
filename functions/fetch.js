const firestore = require('./services/firestore');
const flow = require('./services/flow');
const slack = require('./services/slack');

const fetch = async () => {
    const currentBlock = await flow.getCurrentBlock();
    const lastBlock = (await firestore.getLastBlock()) || currentBlock - 200;
    const events = await flow.getEvents(lastBlock, currentBlock);
    const expandedEvents = await Promise.all(events.map(async (event) => {
        const { blockHeight, blockTimestamp, transactionId, eventId, description, host, image, name, url } = event;
        const tx = await flow.getTx(transactionId);
        const args = {
            forHost: tx.args[0].value, // '0xd2fbd0a481a94a29
            claimable: tx.args[1].value, // true
            name: tx.args[2].value, // 'Float_1'
            description: tx.args[3].value, // 'create your unique nft '
            image: tx.args[4].value, // 'QmU6wS2NSUnUtxT7fqHemJFu8M67oxMySvsF3c35T7Taop'
            url: tx.args[5].value, // 'https://floats.city/create'
            transferrable: tx.args[6].value, // true
            timelock: tx.args[7].value, // false
            dateStart: tx.args[8].value, // '0.0'
            timePeriod: tx.args[9].value, // '0.0'
            secret: tx.args[10].value, // false
            secrets: tx.args[11].value.map(v => v.value), // [ { type: 'String', value: '' } ]
            limited: tx.args[12].value, // false
            capacity: tx.args[13].value, // '0'
            initialGroups: tx.args[14].value, // []
            flowTokenPurchase: tx.args[15].value, // false
            flowTokenCost: tx.args[16].value, // '0.0'
        }
        return {
            blockHeight,
            blockTimestamp,
            transactionId,
            eventId,
            name,
            description,
            url,
            floatUrl: `https://floats.city/${host}/event/${eventId}`,
            flowscanUrl: `https://flowscan.org/transaction/${transactionId}`,
            imageUrl: `https://ipfs.infura.io/ipfs/${image}`,
            createdDate: new Date(blockTimestamp),
            claimable: args.claimable,
            transferrable: args.transferrable,
            timelock: args.timelock,
            secret: args.secret,
            secrets: JSON.stringify(args.secrets),
        };
    }));
    await firestore.addEvents(expandedEvents);

    for (const expandedEvent of expandedEvents) {
        console.log('event:', JSON.stringify(expandedEvent));
        await slack.sendEvent(expandedEvent);
    }

    await firestore.setLastBlock(currentBlock + 1);
};

module.exports = { fetch };
