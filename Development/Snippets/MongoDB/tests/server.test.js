const expect = require('expect');
const request = require('supertest');
const { ObjectID } = require('mongodb');

const { app } = require('./../server');
const { Todo } = require('./../models/todo');

const todos = [{
    _id: new ObjectID(),
    text: "First test todo",
}, {
    _id: new ObjectID(),
    text: "Second test todo",
    completed: false,
    completedAt: 333
}];

beforeEach((done) => {
    Todo.deleteMany({}).then(() => {
        return Todo.insertMany(todos);
    }).then(() => done());
});

describe('POST /todos', () => {
    it('should create a new todo', (done) => {
        var text = 'Test todo text';

        request(app)
            .post('/todos')
            .send({ text })
            .expect(200)
            .expect((res) => {
                expect(res.body.text).toBe(text);
            })
            .end((error, res) => {
                if(error) {
                    return done(error);
                }

                Todo.find({text}).then((todos) => {
                    expect(todos.length).toBe(1);
                    expect(todos[0].text).toBe(text);
                    done();
                }).catch((e) => done(e));
            });
    });

    it('should not create todo with invalid body data', (done) => {
        request(app)
            .post('/todos')
            .send({ })
            .expect(400)
            .end((error, res) => {
                if(error) return done(error);

                Todo.find().then((todos) => {
                    expect(todos.length).toBe(2);
                    done();
                }).catch((error) => done(error));
            })
    });
});

describe('GET /todos', () => {
    it('should get all todos', (done) => {
        request(app)
            .get('/todos')
            .expect(200)
            .expect((res) => {
                expect(res.body.todos.length).toBe(2);
            })
            .end(done);
    });
});

describe('GET /todos/:id', () => {
    it('should return todo doc', (done) => {
        request(app)
            .get(`/todos/${todos[0]._id.toHexString()}`)
            .expect(200)
            .expect((res) => {
                expect(res.body.todo.text).toBe(todos[0].text);
            })
            .end(done);
    });

    it('should return 404 if todo not found', (done) => {
        request(app)
            .get(`/todos/${(new ObjectID()).toHexString()}`)
            .expect(400)
            .end(done);
    });

    it('should return 404 for non-object id', (done) => {
        request(app)
        .get(`/todos/blahblahblah`)
        .expect(400)
        .end(done);
    });
});

describe("DELETE /todos/:id", () => {
    it('should remove a todo', (done) => {
        var hexId = todos[0]._id.toHexString();

        request(app)
            .delete(`/todos/${hexId}`)
            .expect(200)
            .expect((res) => {
                expect(res.body._id).toBe(hexId);
            })
            .end((err, res) => {
                if(err) return done(err);

                Todo.findById(hexId).then((ret) => {
                    expect(ret).toBe('asdasd');
                    done();
                }).catch((e) => done());
            });
    });
/*
    it('should return 404 if todo not found', (done) => {

    });

    it('should return 404 it object id is invalid', (done) => {

    });*/
});

describe('PATCH /todos/:id', () => {
    it('should update the todo', (done) => {
        var newText = "Some good text";
        var updateTime = (new Date()).getTime();

        request(app)
            .patch(`/todos/${todos[1]._id}`)
            .send({
                text: newText,
                completed: true
            })
            .expect(200)
            .expect((res) => {
                expect(res.body.text).toBe(newText);
                expect(res.body.completed).toBe(true);
                expect(res.body.completedAt).toBeA(Number);
                
            })
            .end(done);
    });
/*
    it('should clear completedAt when todo is completed', (done) => {

    });*/
});