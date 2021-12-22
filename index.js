const express = require("express");
const cors = require("cors");
const ObjectId = require('mongodb').ObjectId;
const { MongoClient } = require("mongodb");
const fileUpload = require('express-fileupload');
require("dotenv").config();

const app = express();
const port = process.env.PORT || 5000

//middleware
app.use(cors());
app.use(express.json());
app.use(fileUpload());

//linked to mongoDB
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.nort6.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

async function run() {
    try {
        await client.connect();
        const database = client.db('news-today');
        const usersCollection = database.collection("users");
        const newsCollection = database.collection("news");
        const clientsRating = database.collection("rating");

        //***/== POST API to add ratings ==/***//

        app.post('/ratings', async (req, res) => {
            const rating = req.body;
            const result = await clientsRating.insertOne(rating);
            res.json(result);
        })
        //== get review
        app.get('/getAllReviews', async (req, res) => {
            const result = await clientsRating.find().sort({ $natural: -1 }).toArray();
            res.send(result);
        })
        //POST API to add user through email and pass
        app.post('/users', async (req, res) => {
            const user = req.body;
            const result = await usersCollection.insertOne(user);
            res.json(result);
        })
        //POST API to add news in newsCollection
        app.post('/addNews', async (req, res) => {
            const by = req.body.by;
            const name = req.body.name;
            const email = req.body.email;
            const category = req.body.category;
            const date = req.body.date;
            const details = req.body.details;
            const picData = req.files.picture.data;
            const encodedPic = picData.toString('base64');
            const imgBuffer = Buffer.from(encodedPic, 'base64');
            const newCar =
            {
                name, email, category, by, date, picture2: imgBuffer, details
            }
            const result = await newsCollection.insertOne(newCar);
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
        //== get all admin to show
        app.get('/users/adminList', async (req, res) => {
            res.send(await usersCollection.find({ role: 'admin' }).toArray());
        })
        // == get last 6 news from news
        app.get('/latestNews', async (req, res) => {
            const cursor = newsCollection.find().sort({ $natural: -1 }).limit(15);
            const latestNews = await cursor.toArray();
            res.send(latestNews);
        })
        // == get all news
        app.get('/allLatestNews', async (req, res) => {
            const cursor = newsCollection.find().sort({ $natural: -1 });
            const latestNews = await cursor.toArray();
            res.send(latestNews);
        })
        //delete api to delete one news from all cars
        app.delete('/all_News/delete/:_id', async (req, res) => {
            const id = req.params._id;
            const query = { _id: ObjectId(id) };
            const result = await newsCollection.deleteOne(query);
            res.json(result);
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

        })
        //***/== Put api to update client admin role ==/***//
        app.put('/user/makeAdmin', async (req, res) => {
            const user = req.body;
            const query = { email: user.email };
            const updateDoc = { $set: { role: 'admin' } }
            const result = await usersCollection.updateOne(query, updateDoc);
            res.json(result);

        })
        //get api for one car doc with id query
        app.get('/newsDetails/:_id', async (req, res) => {
            const id = req.params._id;
            const query = { _id: ObjectId(id) };
            const result = await newsCollection.findOne(query);
            res.send(result);
        })
        //get news with category
        app.get('/news/:topic', async (req, res) => {
            const topic = req.params.topic;
            const query = { category: topic }
            const cursor = newsCollection.find(query).sort({ $natural: -1 });
            const result = await cursor.toArray()
            res.send(result);
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