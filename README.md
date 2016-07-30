# Slack Beerfinder


### What's in
A trivial node express server that find beers on Untappd.
The server is listening for a Slack slash command webhook and responding with a Slack payload.
That's all.


### What's not in
Slack or Untappd API keys :)


### How do I get set up?
1/ [Set up a slash command](https://api.slack.com/slash-commands) in slack.

2/ Run a web service somewhere. If you just want to test Beerfinder on a local environment, I highly recommand you [localtunnel](https://localtunnel.github.io/www/)

3/ Clone this repository, create a config.js file (there's a config.sample.js) and fill it with your API credentials.

4/ run `$ node main.js` and test your slack command.
The slash command in action should look like this :
![screenshot](https://raw.githubusercontent.com/theChesCat/slack-beerfinder/master/screenshot.png)
