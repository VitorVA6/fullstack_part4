const mongoose = require('mongoose')
const supertest = require('supertest')
const app = require('../app')
const bcrypt = require('bcrypt')
const User = require('../models/user')

const api = supertest(app)

describe('when there is initially one user in db', () => {
  beforeEach(async () => {
    await User.deleteMany({})

    const passwordHash = await bcrypt.hash('sekret', 10)

    const user = new User({
      username: 'root',
      name: 'root',
      password: passwordHash
    })

    await user.save()
  })

  test('creation succeeds with a fresh username', async () => {
    const usersAtStart = await User.find({})

    const newUser = {
      username: 'vitorva6',
      name: 'Vitor Vaz',
      password: 'teste123',
    }

    await api
      .post('/api/users')
      .send(newUser)
      .expect(201)
      .expect('Content-Type', /application\/json/)

    const usersAtEnd = await User.find({})

    expect(usersAtEnd).toHaveLength(usersAtStart.length + 1)

    const usernames = usersAtEnd.map(u => u.username)
    expect(usernames).toContain(newUser.username)
  })
  test('creation fails if username already taken', async () => {
    const usersAtStart = await User.find({})

    const newUser = {
      username: 'root',
      name: 'root',
      password: 'test1234'
    }

    const result = await api
      .post('/api/users')
      .send(newUser)
      .expect(422)
      .expect('Content-Type', /application\/json/)

    expect(result.body.error).toContain('expected `username` to be unique')

    const usersAtEnd = await User.find({})
    expect(usersAtEnd).toEqual(usersAtStart)
  })

  test('creation fails if username or password are invalids', async () => {
    const usersAtStart = await User.find({})

    const newUser = {
      username: 'ar',
      name: 'root',
      password: 'test1234'
    }

    const result = await api
      .post('/api/users')
      .send(newUser)
      .expect(422)
      .expect('Content-Type', /application\/json/)

    expect(result.body.error).toContain('Path `username` (`ar`) is shorter than the minimum allowed length (3).')

    const usersAtEnd = await User.find({})
    expect(usersAtEnd).toEqual(usersAtStart)
  })
})

afterAll(async () => {
  await mongoose.connection.close()
})