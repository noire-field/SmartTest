var env = process.env.NODE_ENV;

const express = require('express');
const bodyParser = require('body-parser');
const { ObjectID } = require('mongodb');
const _ = require('lodash');

var { Todo } = require('./models/todo');
var { User } = require('./models/user');
var { authendicate } = require('./middleware/authendicate');

var app = express();

const PORT = process.env.PORT || 80;

app.use(bodyParser.json());

app.post('/todos', (req, res, next) => {
    var todo = new Todo({
        text: req.body.text
    });

    todo.save().then((doc) => {
        res.send(doc);
    }, (e) => {
        res.status(400).send(e);
    });
});

app.get('/todos', (req, res) => {
    Todo.find().then((todos) => {
        res.send({todos:todos})
    }, (error) => {
        res.status(400).send(error);
    });
});

app.get('/todos/:id', (req, res) => {
    var id = req.params.id;

    if(!ObjectID.isValid(id)) 
        return res.status(400).send('Invalid todo id');

    Todo.findById(id).then((todo) => {
        if(!todo) return res.status(400).send('Todo not found');
        res.status(200).send({todo});
    }).catch((error) => res.status(400).send('Error querying'));
});

app.delete('/todos/:id', (req, res) => {
    var id = req.params.id;

    if(!ObjectID.isValid(id)) 
        return res.status(404).send('Invalid todo id');

    Todo.findById(id).then((todo) => {
        if(!todo) return res.status(404).send('Todo not found');
        res.status(200).send(todo);
    }).catch((error) => res.status(400).send('Error querying'));
});

app.patch('/todos/:id', (req, res) => {
    var id = req.params.id;
    var body = _.pick(req.body, ['text','completed']);

    if(!ObjectID.isValid(id)) 
        return res.status(404).send('Invalid todo id');

    if(_.isBoolean(body.completed) && body.completed) {
        body.completedAt = (new Date()).getTime();
    } else {
        body.completed = false;
        body.completedAt = null;
    }

    Todo.findByIdAndUpdate(id, {
        $set: body
    }, {new: true}).then((todo) => {
        if(!todo) return res.status(404).send('Todo not found');
        res.status(200).send(todo);
    }).catch((error) => {
        res.status(400).send('Todo error querying');
    });
});

app.post('/users', (req, res) => {
    var body = _.pick(req.body, ['email','password']);
    var user = new User(body);

    user.save().then(() => {
        return user.generateAuthToken();
    }).then((token) => {
        res.header('X-AUTH', token).send(user);
    }).catch((error) => {
        res.status(400).send(error);
    })
});

app.get('/users/me', authendicate, (req, res) => {
    res.send(req.user);
});

app.get('/debug', (req, res) => {
    res.status(200).send({
        "MONGODB": process.env.MONGODB_URI
    });
});

app.listen(PORT, () => {
    console.log(`Server started on port ${PORT}`);
});

module.exports = { app };