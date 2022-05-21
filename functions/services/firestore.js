const { admin } = require('../firebase');

class Firestore {
    constructor() {
        this.db = admin.firestore();
    }

    async getConfig() {
        const docRef = await this.db.collection('config').doc('config');
        const doc = await docRef.get();
        console.log({ doc });
        return doc.exists ? doc.data() : {};
    }

    async getLastBlock() {
        const config = await this.getConfig();
        console.log({ config });
        return config.lastBlock;
    }

    async setLastBlock(lastBlock) {
        const collectionRef = await this.db.collection('config');
        return await collectionRef.doc('config').set({ lastBlock });
    }

    async addEvents(events) {
        let batch = this.db.batch();
        const collectionRef = await this.db.collection('created_events');
        let count = 0;
        for (const event of events) {
            if (++count % 500 === 0) {
                batch.commit();
                batch = db.batch();
            }
            const docRef = collectionRef.doc(String(event.eventId));
            batch.set(docRef, event);
        }
        batch.commit();
    }
}

module.exports = new Firestore();
