const { WebClient } = require('@slack/web-api');
const { functions } = require('../firebase');
const config = functions.config();

class Slack {
    constructor() {
        const token = config['slack']['user-oauth-token'];
        this.client = new WebClient(token);
        this.channel = '#float-events';
    }

    async sendEvent(event) {
        const response = await this.client.chat.postMessage({
            channel: this.channel,
            text: '<!channel> FLOATEventCreated: ' + event.imageUrl,
            attachments: [
                {
                    "color": "#2eb886",
                    "fields": [
                        {
                            "title": "name",
                            "value": event.name,
                            "short": true
                        },
                        {
                            "title": "description",
                            "value": event.description,
                            "short": true
                        },
                        {
                            "title": "floatUrl",
                            "value": event.floatUrl,
                            "short": true
                        },
                        {
                            "title": "createdDate",
                            "value": event.createdDate,
                            "short": true
                        },
                        {
                            "title": "claimable",
                            "value": event.claimable.toString(),
                        },
                        {
                            "title": "transferrable",
                            "value": event.transferrable.toString(),
                        },
                        {
                            "title": "timelock",
                            "value": event.timelock.toString(),
                        },
                        {
                            "title": "secret",
                            "value": event.secret.toString(),
                        },
                        {
                            "title": "secrets",
                            "value": event.secrets,
                        },
                    ],
                }
            ]
        });
        if (!response.ok) {
            console.log('Error', response);
        }
    }
}

module.exports = new Slack();
