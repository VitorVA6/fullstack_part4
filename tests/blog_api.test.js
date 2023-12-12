const mongoose = require('mongoose')
const supertest = require('supertest')
const app = require('../app')
const Blog = require('../models/blog')
const User = require('../models/user')
const bcrypt = require('bcrypt')

const api = supertest(app)

const initialBlogs = [
  {
    title: 'Canonical string reduction',
    author: 'Edsger W. Dijkstra',
    url: 'http://www.cs.utexas.edu/~EWD/transcriptions/EWD08xx/EWD808.html',
    likes: 12,
  },
  {
    title: 'React patterns',
    author: 'Michael Chan',
    url: 'https://reactpatterns.com/',
    likes: 7,
  }
]

describe('when there is initially some blogs saved', () => {

  beforeEach(async () => {
    await User.deleteMany({})
    const passwordHash = await bcrypt.hash('sekret', 10)

    const user = new User({
      username: 'root',
      name: 'root',
      password: passwordHash
    })
    const savedUser = await user.save()

    await Blog.deleteMany({})
    let blogObject = new Blog({ ...initialBlogs[0], user: savedUser.id })
    await blogObject.save()
    let blogObject2 = new Blog({ ...initialBlogs[1], user: savedUser.id })
    await blogObject2.save()
  })

  test('blogs are returned as json', async () => {
    await api.get('/api/blogs')
      .expect(200)
      .expect('Content-Type', /application\/json/)


  }, 100000)

  test('all blogs are returned', async () => {
    const response = await api.get('/api/blogs')

    expect(response.body).toHaveLength(initialBlogs.length)
  }, 100000)

  test('id exists', async () => {
    const response = await api.get('/api/blogs')

    expect(response.body[0].id).toBeDefined()
  }, 100000)

  describe('addition of a new blog', () => {

    test('a valid blog can be added', async () => {
      const { body } = await api
        .post('/api/login')
        .send({ username: 'root', password: 'sekret' })

      const newBlog = {
        title: 'Test',
        author: 'Test',
        url: 'https://test.com/',
        likes: 20,
      }
      await api
        .post('/api/blogs')
        .set('Authorization', `Bearer ${body.token}`)
        .send(newBlog)
        .expect(201)
        .expect('Content-Type', /application\/json/)

      const response = await api.get('/api/blogs')

      const contents = response.body.map(item => item.title)

      expect(response.body).toHaveLength(initialBlogs.length + 1)
      expect(contents).toContain('Test')
    }, 100000)

    test('if likes is undefined turn in 0', async () => {
      const { body } = await api
        .post('/api/login')
        .send({ username: 'root', password: 'sekret' })

      const newBlog = {
        title: 'Test',
        author: 'Test',
        url: 'https://test.com/'
      }
      await api
        .post('/api/blogs')
        .set('Authorization', `Bearer ${body.token}`)
        .send(newBlog)

      const response = await api.get('/api/blogs')

      const hasLikes = response.body.find(item => item.title === 'Test')

      expect(hasLikes.likes).toBe(0)
    }, 100000)

    test('blog without title or url is not added', async () => {
      const { body } = await api
        .post('/api/login')
        .send({ username: 'root', password: 'sekret' })

      const newBlog = {
        url: 'https://test.com/',
        likes: 8
      }
      await api
        .post('/api/blogs')
        .set('Authorization', `Bearer ${body.token}`)
        .send(newBlog)
        .expect(422)
    }, 100000)
  })

  describe('deletion of a blog', () => {
    test('succeeds with a status 204 if id is valid', async () => {
      const { body } = await api
        .post('/api/login')
        .send({ username: 'root', password: 'sekret' })

      const blogsAtStart = await Blog.find({})
      const blogToDelete = blogsAtStart[0]

      await api
        .delete(`/api/blogs/${blogToDelete.id}`)
        .set('Authorization', `Bearer ${body.token}`)
        .expect(204)

      const blogsAtEnd = await Blog.find({})

      expect(blogsAtEnd).toHaveLength(initialBlogs.length - 1)

      const contents = blogsAtEnd.map(b => b.title)
      expect(contents).not.toContain(blogToDelete.title)
    })
    test('fails with a status 401 if token is not provided', async () => {
      const blogsAtStart = await Blog.find({})
      const blogToDelete = blogsAtStart[0]

      await api
        .delete(`/api/blogs/${blogToDelete.id}`)
        .expect(401)

      const blogsAtEnd = await Blog.find({})

      expect(blogsAtEnd).toHaveLength(initialBlogs.length)

      const contents = blogsAtEnd.map(b => b.title)
      expect(contents).toContain(blogToDelete.title)
    })
  })

  describe('update of a blog', () => {
    test('succeeds with a valid id', async () => {
      const blogsAtStart = await Blog.find({})
      const blogToUpdate = {
        title: blogsAtStart[0].title,
        url: blogsAtStart[0].url,
        likes: 30,
        author: blogsAtStart[0].author
      }

      const updatedBlog = await api
        .put(`/api/blogs/${blogsAtStart[0].id}`)
        .send(blogToUpdate)
      expect(updatedBlog.body.likes).toBe(30)
    })
  })
})

afterAll(async () => {
  await mongoose.connection.close()
})