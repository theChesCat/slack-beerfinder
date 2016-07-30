const Daemon = require('start-stop-daemon')
const Express = require('express')
const Promise = require('promise')
const Request = Promise.denodeify(require('request'))
const QueryString = require('query-string')

const config = require('./config.js')

class Main {

    constructor () {
        Daemon(() => {
            let app = Express()
            app.listen(8765, () => {
              console.log('App is now turning on port 8765!')
            })
            app.get('/', this.onReceive.bind(this))
        })
    }

    onReceive (request, response) {
        if (!request && !request.query && !response) {
            return
        }

        const token = request.query.token
        const search = request.query.text

        // Token should match the registered one, or it ain't our App calling
        if (token !== config.slack.token) {
            return;
        }

        // If no search
        if (!search) {
            response.end('Please enter a beer name')
            return
        }

        // If there is a search, find it
        this.findBeers(search).then(beers => {
            let title = 'did not found any beer or breweries.'
            let items;
            if (beers && beers.found > 0) {
                items = this.formatUntappdResponse(beers)
                const nBeers = items.beerCount
                const nBreweries = items.breweriesCount
                title = 'found ' + nBeers + ' beers and ' + nBreweries + ' breweries.'
                if ((nBeers + nBreweries) > 5) {
                    title += '\n _Too many answers? Be more accurate in your search._'
                    title += '\n _Ex: do not search "Gamma Ray", search "Beavertown Gamma Ray"._'
                }
            }

            this.displayResults(response, title, items)
        })
    }

    displayResults (response, title, results) {
        if (!response) {
            return;
        }

        const payload = {
            response_type: 'in_channel',
            text: '*BeerFinder* ' + title,
            attachments: results ? [
                (results.beerCount) > 0 ? {
                    title: 'Beers :',
                    fields: results.beers
                } : false,
                (results.breweriesCount > 0) ? {
                    title: 'Breweries :',
                    fields: results.breweries
                } : false
            ] : false
        }

        response.writeHead(200, { 'Content-Type': 'application/json' });
        response.write(JSON.stringify(payload))
        response.end()
    }

    findBeers (search) {
        const params = QueryString.stringify({
            client_id: config.untappd.id,
            client_secret: config.untappd.secret,
            q: search
        })
        const url = 'https://api.untappd.com/v4/search/beer?' + params

        return Request(url).then(response => {
            const body = JSON.parse(response.body)
            const code = body.meta && parseInt(body.meta.code, 10)
            if (body.response && code === 200) {
                return body.response
            }
        }, error => {
            console.log('findBeers function => there was an error retrieving beers with Untappd API')
        });
    }

    formatUntappdResponse (response) {
        const nBeers = parseInt(response.beers.count, 10)
        const nBreweries = parseInt(response.breweries.count, 10)
        const beers = response.beers.items.map(item => {
            const beer = item.beer
            const brewery = item.brewery
            const space = '   |   '
            return {
                title: beer.beer_name,
                value: beer.beer_ibu + ' ibu' + space + beer.beer_abv + '°' +
                       space + beer.beer_style + space + brewery.brewery_name
            }
        })
        const breweries = response.breweries.items.map(item => {
            return {
                title: item.brewery.brewery_name,
                value: item.brewery.country_name
            }
        })

        return {
            beers: beers,
            breweries: breweries,
            beerCount: nBeers,
            breweriesCount: nBreweries
        }
    }
}

new Main();
