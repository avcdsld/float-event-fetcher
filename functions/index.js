const { functions } = require('./firebase');
const { fetch } = require('./fetch');

exports.fetch = functions.https.onRequest((_req, res) => {
    functions.logger.info('fetch start');
    fetch().then(() => {
        functions.logger.info('fetch end');
        res.json({ success: true });
    }).catch((e) => {
        functions.logger.error(e);
        res.status(500).json({ success: false, message: e.message });
    })
});
