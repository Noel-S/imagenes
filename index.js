const express = require('express')
const bodyParser = require('body-parser')
const cassandra = require('cassandra-driver')
const path = require('path')

const client = new cassandra.Client({ contactPoints: ['127.0.0.1'], localDataCenter: 'datacenter1', keyspace: 'images' })
const app = express()

const faker = require('faker')

const fetch = require('node-fetch')

const HOST = 'localhost', PORT = 3000

client.connect(err => {
    if (err) console.error(err)
    else console.log('Cassandra: Connected.')
})

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use('/static', express.static(`${__dirname}/public`))

app.get('/', function (req, res) {
    res.sendFile(path.join(`${__dirname}/public/index.html`));
    console.log('/: Accessed.');
});

app.post('/buscar', function (req, res) {
    let terminos = req.body.busqueda

    if (terminos != '') {
        let cql = `SELECT * FROM images where nombre like '%${terminos}%';`
        console.log(cql);
        
        client.execute(cql, (err, result) => {
            if (err) {
                console.log(err)
                res.json({ "error": false, state: 1 })
            } else {
                res.json({ "error": false, state: 0, images: result.rows});
            }
        });
    }
    
    // let images = []
    // for (let i = 0; i < 5; i++) {
    //     images.push({
    //         title: faker.name.title(),
    //         src: faker.random.image()
    //     })
    // }
});

app.get('/fill', async (req, res) => {
    for (let index = 0; index < 100; index++) {
        const { url } = await fetch('https://source.unsplash.com/random/600X400/') 
        
        let cql = `INSERT INTO images (id, nombre, dimensiones, fecha, formato, url) values(uuid(), '${faker.name.title()}', '600x400', '${new Date().toLocaleDateString().replace('/', '-')}', 'image/jpeg', '${url}')`
    
        client.execute(cql, (err, result) => {
            if (err) {
                console.log(err)
                res.json({ "error": true, state: 1 })
            }
        });
    } 
    res.json({ "error": false, state: 0 });   
});

app.listen(3000, () => console.log(`Express: Listening on => http://${HOST}:${PORT}`) )