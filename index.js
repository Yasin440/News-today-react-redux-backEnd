const express = require("express");
const cors = require("cors");
const ObjectId = require('mongodb').ObjectId;
const { MongoClient } = require("mongodb");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 5000

//middleware
app.use(cors());
app.use(express.json());

//linked to mongoDB
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.nort6.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

async function run() {
    try {
        await client.connect();
        const database = client.db('news-today');
        const usersCollection = database.collection("users");
        const newsCollection = database.collection("news");

        //POST API to add user through email and pass
        app.post('/users', async (req, res) => {
            const user = req.body;
            const result = await usersCollection.insertOne(user);
            res.json(result);
        })
        //------put client through gmail or other authentication
        app.put('/users', async (req, res) => {
            const user = req.body;
            const query = { email: user.email };
            const options = { upsert: true };
            const updateUser = { $set: user };
            const result = await usersCollection.updateOne(query, updateUser, options);
            res.json(result);

        })
        // == get last 6 news from news
        app.get('/latestNews', async (req, res) => {
            const cursor = newsCollection.find().sort({ $natural: -1 }).limit(6);
            const latestNews = await cursor.toArray();
            res.send(latestNews);
        })
        //== get api to get a email which is admin==//
        app.get('/client/isAdmin/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email: email };
            const result = await usersCollection.findOne(query);
            let isAdmin = false;
            if (result?.role === 'admin') {
                isAdmin = true;
            }
            res.json({ admin: isAdmin });
        })
        //==GET api to find admin from user==//
        app.get('/client/allAdmin', async (req, res) => {
            const IsAdmin = "admin";
            const query = { role: IsAdmin };
            const result = await usersCollection.find(query);
            res.send(result);
            console.log(result);

        })

    }
    finally {
        // await client.close();
    }
}
run().catch(console.dir);

app.get('/', (req, res) => {
    res.send('This a Server to Connect "News-today-react-redux" with backEnd');
})
app.listen(port, () => {
    console.log('News-today-react-redux is running on:', port);
})