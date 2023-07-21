const mongoose = require('mongoose')
const supertest = require('supertest')
const helper = require('./test_helper')
const app = require('../app')
const api = supertest(app)
const bcrypt = require('bcrypt')
const User = require('../models/user')



describe('addition of a new user', () => {
  beforeEach(async () => {
    await User.deleteMany({})
    const passwordHash = await bcrypt.hash('sekret', 10)
    const user = new User({ username: 'root', passwordHash })

    await user.save()
  })


  test('succeeds with a valid user request', async () => {
    const usersAtStart = await helper.usersInDb()

    const validUser = {
      username: 'hellas',
      name: 'Arto Hellas',
      password: 'Greece',
    }

    await api
      .post('/api/users')
      .send(validUser)
      .expect(201)
      .expect('Content-Type', /application\/json/)

    const usersAtEnd = await helper.usersInDb()
    expect(usersAtEnd).toHaveLength(usersAtStart.length + 1)

    const usernames = await usersAtEnd.map(u => u.username)
    expect(usernames).toContain(validUser.username)
  })

  test('fails with code 400 if username already exists', async () => {
    const usersAtStart = await helper.usersInDb()

    const invalidUser = {
      username: 'root',
      name: 'Groot',
      password: 'tree'
    }

    const result = await api
      .post('/api/users')
      .send(invalidUser)
      .expect(400)

    expect(result.body.error).toContain('expected `username` to be unique')

    const usersAtEnd = await helper.usersInDb()
    expect(usersAtEnd).toEqual(usersAtStart)
  })

  test('fails with code 400 if username is invalid', async () => {
    const usersAtStart = await helper.usersInDb()

    const badUsername = {
      username: 'B',
      name: 'Barry B. Benson',
      password: 'carlos'
    }

    const result = await api
      .post('/api/users')
      .send(badUsername)

    expect(result.body.error).toContain('shorter than the minimum allowed length')

    const usersAtEnd = await helper.usersInDb()
    expect(usersAtEnd).toEqual(usersAtStart)
  })

  test('fails with code 400 if password is invalid', async () => {
    const usersAtStart = await helper.usersInDb()

    const badPassword = {
      username: 'juan',
      name: 'David',
      password: 'jd',
    }
    
    const result = await api
      .post('/api/users')
      .send(badPassword)

      expect(result.body.error).toContain('password must be longer than 2 characters')

    const usersAtEnd = await helper.usersInDb()
    expect(usersAtEnd).toEqual(usersAtStart)
  })
})



afterAll(async () => {
  await mongoose.connection.close()
})