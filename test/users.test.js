'use strict';


const app = require('../server');
const chai = require('chai');
const chaiHttp = require('chai-http');
const mongoose = require('mongoose');

const { TEST_MONGODB_URI } = require('../config');

const User = require('../models/user');

const expect = chai.expect;

chai.use(chaiHttp);

describe('Noteful API - Users', function () {
  const username = 'exampleUser';
  const password = 'examplePass';
  const fullname = 'Example User';

  before(function () {
    return mongoose.connect(TEST_MONGODB_URI)
      .then(() => mongoose.connection.db.dropDatabase());
  });

  beforeEach(function () {
    return User.createIndexes();
  });

  afterEach(function () {
    return mongoose.connection.db.dropDatabase();
  });

  after(function () {
    return mongoose.disconnect();
  });
  
  describe('/api/users', function () {
    describe('POST', function () {
      it('Should create a new user', function () {
        const testUser = { username, password, fullname };
        let res;
        return chai
          .request(app)
          .post('/api/users')
          .send(testUser)
          .then(_res => { 
            res = _res;
            console.log(res.body);
            expect(res).to.have.status(201);
            expect(res.body).to.be.an('object');
            expect(res.body).to.have.keys('id', 'username', 'fullname');

            expect(res.body.id).to.exist;
            expect(res.body.username).to.equal(testUser.username);
            expect(res.body.fullname).to.equal(testUser.fullname);

            return User.findOne({ username });
          })
          .then(user => {
            expect(user).to.exist;
            expect(user.id).to.equal(res.body.id);
            expect(user.fullname).to.equal(testUser.fullname);
            return user.validatePassword(password);
          })
          .then(isValid => {
            expect(isValid).to.be.true;
          });
      });
      it('Should reject users with missing username', function () {
        const testUser = { password, fullname };
        return chai.request(app).post('/api/users').send(testUser)
          .catch(res => {
            expect(res).to.have.status(500);
            expect(res.body.message).to.eq('User validation failed: username: Path `username` is required.');
          });
      });

      /**
       * COMPLETE ALL THE FOLLOWING TESTS
       */
      it('Should reject users with missing password', function () {
        const nopass = {
          username: 'baduser',
          fullname: 'badperson',
        };
        return chai.request(app).post('/api/users').send(nopass)
          .then(res => {
            expect(res).to.have.status(400);
            expect(res.body.message).to.eq('Must include username and password');

          }); });


      it('Should reject users with non-string username', function () {
        const numberUser = {
          username: {},
          password: 'password',
          fullname: 'numberMan'
        };
        return chai.request(app).post('/api/users').send(numberUser)
          .then(res => {          
            expect(res).to.have.status(400);
            expect(res.body.message).to.equal('Password and username must be string');
          }); });
      it('Should reject users with non-string password', function () {
        const objPassword = {
          username: 'user1',
          password: {},
          fullname: 'fullname'
        };

        return chai.request(app).post('/api/users').send(objPassword)
          .then(res => {
            expect(res).to.have.status(400);
            expect(res.body.message).to.equal('Password and username must be string');
          });
      });
      it('Should reject users with non-trimmed username', function () {
        const whiteSpaceUser = {
          password: password,
          fullname: 'smith',
          username: '  user1'
        };
        return chai.request(app).post('/api/users').send(whiteSpaceUser)
          .then(res => {
            expect(res).to.have.status(422);
            expect(res.body.message).to.equal('Field: \'username\' cannot start or end with whitespace');
          });
      });
      it('Should reject users with non-trimmed password', function () {
        const whiteSpace = {
          password: '  password',
          fullname: 'smith',
          username: 'user1'
        };
        return chai.request(app).post('/api/users').send(whiteSpace)
          .then(res => {
            expect(res).to.have.status(422);
            expect(res.body.message).to.equal('Field: \'password\' cannot start or end with whitespace');
          });

      });
      it('Should reject users with empty username', function () {

        const nouser = {
          password: 'baduser',
          fullname: 'badperson',
        };
        return chai.request(app).post('/api/users').send(nouser)
          .then(res => {
            expect(res).to.have.status(400);
            expect(res.body.message).to.eq('Must include username and password');
    
          });

      });
      it('Should reject users with password less than 8 characters', function () {
        const littlePass = {
          username: 'username',
          fullname: 'full name',
          password: 'fox'
        };
        return chai.request(app).post('/api/users').send(littlePass)
          .then (res => {
            expect(res).to.have.status(400);
            expect(res.body.message).to.eq('password must be between 8 and 72 characters');
          });


      });
      it('Should reject users with password greater than 72 characters', function () {
        const bigPass = {
          username: 'username',
          fullname: 'full name',
          password: 'thequickbrownfoxjumpsoverthelazydogthequickbrownfoxjumpsoverthelazydogthequickbrownfoxjumpsoverthelazydog'
        };
        return chai.request(app).post('/api/users').send(bigPass)
          .then (res => {
            expect(res).to.have.status(400);
            expect(res.body.message).to.eq('password must be between 8 and 72 characters');
          });
      });
      it('Should reject users with duplicate username', function () {
        const tulpa = {
          username,
          password,
          fullname
        };
        return chai.request(app).post('/api/users').send(tulpa)
          .then( () => {
            return chai.request(app).post('/api/users').send(tulpa)
              .then ( res => {
                expect(res).to.have.status(400);
                expect(res.body.message).to.equal('The username already exists');

              });
          });
      });
      it('Should trim fullname', function () {
        const spacey = {
          username,
          password,
          fullname: '  fullname  '
        };

        let withSpace = fullname.length;

        return chai.request(app).post('/api/users').send(spacey)
          .then ( (res) => {
            console.log(res.body);
            expect(res).to.have.status(201);
            expect((res.body.fullname).length).to.eq(8);
          });
      });
    });

    // describe('GET', function () {
    //   it('Should return an empty array initially', function () {
    //     return chai.request(app).get('/api/users')
    //       .then(res => {
    //         expect(res).to.have.status(200);
    //         expect(res.body).to.be.an('array');
    //         expect(res.body).to.have.length(0);
    //       });
    //   });
    //   it('Should return an array of users', function () {
    //     const testUser0 = {
    //       username: `${username}`,
    //       password: `${password}`,
    //       fullname: ` ${fullname} `
    //     };
    //     const testUser1 = {
    //       username: `${username}1`,
    //       password: `${password}1`,
    //       fullname: `${fullname}1`
    //     };
    //     const testUser2 = {
    //       username: `${username}2`,
    //       password: `${password}2`,
    //       fullname: `${fullname}2`
    //     };

    //     /**
    //      * CREATE THE REQUEST AND MAKE ASSERTIONS
    //      */
    //   });
    // });
  });
});