import chai from 'chai';
import chaiHttp from 'chai-http';
import bcrypt from 'bcrypt';
import sinon from 'sinon';
import Sinonchai from 'sinon-chai';
import app from '../../index';
import models from '../../db/models';
import FacilitiesController from '../../controllers/facilities.controller';

chai.use(chaiHttp);
chai.should();
chai.use(Sinonchai);

const { expect } = chai;
const { User, Facility } = models;

const newUser = {
  first_name: 'Chidi',
  last_name: 'Emenike',
  email: 'chinonsyuhokeo@gmail.com',
  password: 'password123'
};

const facility = {
  name: '48989',
  street: '34 Idu',
  city: 'Abuja',
  country: 'Nigeria',
  address: 'Otolo, Nnewi',
  number_of_rooms: 8,
  available_space: 7,
  images: 'https://cloudinary.com/16x16/1.png,https://cloudinary.com/16x16/1.png',
  description: 'Our services are the best'
};

let testUser;
let adminToken;
const route = '/api/v1/facilities';

const travel_admin = {
  email: 'jane_doe@email.com',
  password: 'asdfghjkl'
};

before((done) => {
  bcrypt.hash(newUser.password, 10)
    .then((hash) => User.create({
      first_name: newUser.first_name,
      last_name: newUser.last_name,
      email: newUser.email,
      password: hash
    }))
    .then((user) => {
      testUser = user;
      done();
    })
    .catch((e) => done(e));
  chai
    .request(app)
    .post('/api/v1/auth/signin')
    .send(travel_admin)
    .end((err, res) => {
      res.should.have.status(200);
      res.body.should.be.an('object');
      res.body.should.have.property('status').eql('success');
      res.body.should.have.property('data');
      res.body.data.should.have.property('token');
      adminToken = res.body.data.token;
    });
});

after((done) => {
  User.destroy({
    where: {
      email: newUser.email
    }
  })
    .then(() => done())
    .catch((e) => done(e));
});

describe('FACILITIES', () => {
  // Test Travel Admin Listing his accomodation facilities
  describe('/POST Travel Admin/Super_Admin Lists Accommodation Facilities', () => {
    it('it should return unauthorized if user is not logged in', (done) => {
      chai.request(app)
        .post(route)
        .end((error, res) => {
          res.should.have.status(401);
          res.body.should.be.an('object');
          res.body.should.have.property('status').eql('error');
          res.body.should.have.property('error').eql('No token provided!');
          done();
        });
    });

    it('it should return an error if user is not a super_admin or manager', (done) => {
      chai.request(app)
        .post('/api/v1/auth/signin')
        .send({
          email: newUser.email,
          password: newUser.password
        })
        .end((err, res) => {
          res.should.have.status(200);
          res.body.should.be.an('object');
          res.body.should.have.property('status').eql('success');
          res.body.should.have.property('data');
          res.body.data.should.have.property('token');
          expect(res.body.data.first_name).to.equal(testUser.first_name);
          expect(res.body.data.last_name).to.equal(testUser.last_name);
          expect(res.body.data.email).to.equal(testUser.email);
          const { token } = res.body.data;

          chai.request(app)
            .post(route)
            .set('x-access-token', token)
            .end((error, data) => {
              data.should.have.status(401);
              data.body.should.be.an('object');
              done();
            });
        });
    });

    it('Should send a 422 error if no facilities details is entered', (done) => {
      chai.request(app)
        .post(route)
        .send({})
        .set('Authorization', adminToken)
        .end((error, res) => {
          expect(res).to.have.status(422);
          expect(res.body).to.have.keys('status', 'error');
          expect(res.body.status).to.deep.equal('error');
          expect(res.body.error).to.deep.equal('You have not entered any facilities details');
          done();
        });
    });

    it('Should send a 422 error if facility name is not provided', (done) => {
      chai.request(app)
        .post(route)
        .send({
          address: 'Otolo, Nnewi',
          number_of_rooms: 8,
          available_space: 7,
          images: ['https://cloudinary.com/16x16/1.png', 'https://cloudinary.com/16x16/1.png'],
          description: 'Our services are the best'
        })
        .set('Authorization', adminToken)
        .end((error, res) => {
          expect(res).to.have.status(422);
          expect(res.body).to.have.keys('status', 'error');
          expect(res.body.status).to.deep.equal('error');
          expect(res.body.error).deep.to.be.an('array');
          expect(res.body.error[0]).to.have.keys('field', 'message');
          expect(res.body.error[0].field).to.deep.equal('name');
          expect(res.body.error[0].message).to.deep.equal('Kindly Provide a name for your facility');
          done();
        });
    });

    it('Should send a 422 error if name is not a string', (done) => {
      chai.request(app)
        .post(route)
        .send({
          name: 4,
          address: 'Otolo, Nnewi',
          number_of_rooms: 8,
          available_space: 7,
          images: ['https://cloudinary.com/16x16/1.png', 'https://cloudinary.com/16x16/1.png'],
          description: 'Our services are the best'
        })
        .set('Authorization', adminToken)
        .end((error, res) => {
          expect(res).to.have.status(422);
          expect(res.body).to.have.keys('status', 'error');
          expect(res.body.status).to.deep.equal('error');
          expect(res.body.error).deep.to.be.an('array');
          expect(res.body.error[0]).to.have.keys('field', 'message');
          expect(res.body.error[0].field).to.deep.equal('name');
          expect(res.body.error[0].message).to.deep.equal('The name of your facility must be a string');
          done();
        });
    });

    it('Should send a 422 error if name is too short', (done) => {
      chai.request(app)
        .post(route)
        .send({
          name: 'T',
          address: 'Otolo, Nnewi',
          number_of_rooms: 8,
          available_space: 7,
          images: ['https://cloudinary.com/16x16/1.png', 'https://cloudinary.com/16x16/1.png'],
          description: 'Our services are the best'
        })
        .set('Authorization', adminToken)
        .end((error, res) => {
          expect(res).to.have.status(422);
          expect(res.body).to.have.keys('status', 'error');
          expect(res.body.status).to.deep.equal('error');
          expect(res.body.error).deep.to.be.an('array');
          expect(res.body.error[0]).to.have.keys('field', 'message');
          expect(res.body.error[0].field).to.deep.equal('name');
          expect(res.body.error[0].message).to.deep.equal('Too short: enter a minimum of 2 characters');
          done();
        });
    });

    it('Should send a 422 error if facility street is not provided', (done) => {
      chai.request(app)
        .post(route)
        .send({
          name: 'Towers',
          address: 'Otolo, Nnewi',
          number_of_rooms: 8,
          available_space: 7,
          images: ['https://cloudinary.com/16x16/1.png', 'https://cloudinary.com/16x16/1.png'],
          description: 'Our services are the best'
        })
        .set('Authorization', adminToken)
        .end((error, res) => {
          expect(res).to.have.status(422);
          expect(res.body).to.have.keys('status', 'error');
          expect(res.body.status).to.deep.equal('error');
          expect(res.body.error).deep.to.be.an('array');
          expect(res.body.error[0]).to.have.keys('field', 'message');
          expect(res.body.error[0].field).to.deep.equal('street');
          expect(res.body.error[0].message).to.deep.equal('Kindly Provide the street name of your facility');
          done();
        });
    });

    it('Should send a 422 error if street name is not a string', (done) => {
      chai.request(app)
        .post(route)
        .send({
          name: 'NY Best',
          street: 458978,
          address: 'Otolo, Nnewi',
          number_of_rooms: 8,
          available_space: 7,
          images: ['https://cloudinary.com/16x16/1.png', 'https://cloudinary.com/16x16/1.png'],
          description: 'Our services are the best'
        })
        .set('Authorization', adminToken)
        .end((error, res) => {
          expect(res).to.have.status(422);
          expect(res.body).to.have.keys('status', 'error');
          expect(res.body.status).to.deep.equal('error');
          expect(res.body.error).deep.to.be.an('array');
          expect(res.body.error[0]).to.have.keys('field', 'message');
          expect(res.body.error[0].field).to.deep.equal('street');
          expect(res.body.error[0].message).to.deep.equal('The street must be a string');
          done();
        });
    });

    it('Should send a 422 error if street name does not contain letters', (done) => {
      chai.request(app)
        .post(route)
        .send({
          name: 'NY Best',
          street: '48789',
          address: 'Otolo, Nnewi',
          number_of_rooms: 8,
          available_space: 7,
          images: ['https://cloudinary.com/16x16/1.png', 'https://cloudinary.com/16x16/1.png'],
          description: 'Our services are the best'
        })
        .set('Authorization', adminToken)
        .end((error, res) => {
          expect(res).to.have.status(422);
          expect(res.body).to.have.keys('status', 'error');
          expect(res.body.status).to.deep.equal('error');
          expect(res.body.error).deep.to.be.an('array');
          expect(res.body.error[0]).to.have.keys('field', 'message');
          expect(res.body.error[0].field).to.deep.equal('street');
          expect(res.body.error[0].message).to.deep.equal('Street must contain atleast a letter');
          done();
        });
    });

    it('Should send a 422 error if facility city is not provided', (done) => {
      chai.request(app)
        .post(route)
        .send({
          name: 'Nnewi',
          street: 'NYBest',
          address: 'Otolo, Nnewi',
          number_of_rooms: 8,
          available_space: 7,
          images: ['https://cloudinary.com/16x16/1.png', 'https://cloudinary.com/16x16/1.png'],
          description: 'Our services are the best'
        })
        .set('Authorization', adminToken)
        .end((error, res) => {
          expect(res).to.have.status(422);
          expect(res.body).to.have.keys('status', 'error');
          expect(res.body.status).to.deep.equal('error');
          expect(res.body.error).deep.to.be.an('array');
          expect(res.body.error[0]).to.have.keys('field', 'message');
          expect(res.body.error[0].field).to.deep.equal('city');
          expect(res.body.error[0].message).to.deep.equal('City of location of your facility');
          done();
        });
    });

    it('Should send a 422 error if city does not comprise only of letters', (done) => {
      chai.request(app)
        .post(route)
        .send({
          name: 'Nnewi',
          street: 'NYBest',
          city: 'uut768uu',
          country: 'uutyuuu',
          address: 'Otolo, Nnewi',
          number_of_rooms: 8,
          available_space: 7,
          images: ['https://cloudinary.com/16x16/1.png', 'https://cloudinary.com/16x16/1.png'],
          description: 'Our services are the best'
        })
        .set('Authorization', adminToken)
        .end((error, res) => {
          expect(res).to.have.status(422);
          expect(res.body).to.have.keys('status', 'error');
          expect(res.body.status).to.deep.equal('error');
          expect(res.body.error).deep.to.be.an('array');
          expect(res.body.error[0]).to.have.keys('field', 'message');
          expect(res.body.error[0].field).to.deep.equal('city');
          expect(res.body.error[0].message).to.deep.equal('The city of your facility must be letters only');
          done();
        });
    });

    it('Should send a 422 error if facility country is not provided', (done) => {
      chai.request(app)
        .post(route)
        .send({
          name: 'Nnewi',
          street: 'NYBest',
          city: 'uouuty',
          address: 'Otolo, Nnewi',
          number_of_rooms: 8,
          available_space: 7,
          images: ['https://cloudinary.com/16x16/1.png', 'https://cloudinary.com/16x16/1.png'],
          description: 'Our services are the best'
        })
        .set('Authorization', adminToken)
        .end((error, res) => {
          expect(res).to.have.status(422);
          expect(res.body).to.have.keys('status', 'error');
          expect(res.body.status).to.deep.equal('error');
          expect(res.body.error).deep.to.be.an('array');
          expect(res.body.error[0]).to.have.keys('field', 'message');
          expect(res.body.error[0].field).to.deep.equal('country');
          expect(res.body.error[0].message).to.deep.equal('Kindly Provide a name for your facility');
          done();
        });
    });

    it('Should send a 422 error if country is not all letters', (done) => {
      chai.request(app)
        .post(route)
        .send({
          name: 'Nnewi',
          street: 'NYBest',
          city: 'uouuty',
          country: '89utyr',
          address: 'Otolo, Nnewi',
          number_of_rooms: 8,
          available_space: 7,
          images: ['https://cloudinary.com/16x16/1.png', 'https://cloudinary.com/16x16/1.png'],
          description: 'Our services are the best'
        })
        .set('Authorization', adminToken)
        .end((error, res) => {
          expect(res).to.have.status(422);
          expect(res.body).to.have.keys('status', 'error');
          expect(res.body.status).to.deep.equal('error');
          expect(res.body.error).deep.to.be.an('array');
          expect(res.body.error[0]).to.have.keys('field', 'message');
          expect(res.body.error[0].field).to.deep.equal('country');
          expect(res.body.error[0].message).to.deep.equal('The country of your facility must be letters only');
          done();
        });
    });

    it('Should send a 422 error if facility address is not provided', (done) => {
      chai.request(app)
        .post(route)
        .send({
          name: 'Nnewi',
          street: 'NYBest',
          city: 'uouuty',
          country: 'NYC',
          number_of_rooms: 8,
          available_space: 7,
          images: ['https://cloudinary.com/16x16/1.png', 'https://cloudinary.com/16x16/1.png'],
          description: 'Our services are the best'
        })
        .set('Authorization', adminToken)
        .end((error, res) => {
          expect(res).to.have.status(422);
          expect(res.body).to.have.keys('status', 'error');
          expect(res.body.status).to.deep.equal('error');
          expect(res.body.error).deep.to.be.an('array');
          expect(res.body.error[0]).to.have.keys('field', 'message');
          expect(res.body.error[0].field).to.deep.equal('address');
          expect(res.body.error[0].message).to.deep.equal('Kindly Provide a valid address for your facility');
          done();
        });
    });

    it('Should send a 422 error if facility address is not a string', (done) => {
      chai.request(app)
        .post(route)
        .send({
          name: 'Nnewi',
          street: 'NYBest',
          city: 'uouuty',
          country: 'NYC',
          address: 8989675,
          number_of_rooms: 8,
          available_space: 7,
          images: ['https://cloudinary.com/16x16/1.png', 'https://cloudinary.com/16x16/1.png'],
          description: 'Our services are the best'
        })
        .set('Authorization', adminToken)
        .end((error, res) => {
          expect(res).to.have.status(422);
          expect(res.body).to.have.keys('status', 'error');
          expect(res.body.status).to.deep.equal('error');
          expect(res.body.error).deep.to.be.an('array');
          expect(res.body.error[0]).to.have.keys('field', 'message');
          expect(res.body.error[0].field).to.deep.equal('address');
          expect(res.body.error[0].message).to.deep.equal('The address of your facility must be a string');
          done();
        });
    });

    it('Should send a 422 error if facility address doesn\'t contain any letters', (done) => {
      chai.request(app)
        .post(route)
        .send({
          name: 'Nnewi',
          street: 'NYBest',
          city: 'uouuty',
          country: 'NYC',
          address: '87',
          number_of_rooms: 8,
          available_space: 7,
          images: ['https://cloudinary.com/16x16/1.png', 'https://cloudinary.com/16x16/1.png'],
          description: 'Our services are the best'
        })
        .set('Authorization', adminToken)
        .end((error, res) => {
          expect(res).to.have.status(422);
          expect(res.body).to.have.keys('status', 'error');
          expect(res.body.status).to.deep.equal('error');
          expect(res.body.error).deep.to.be.an('array');
          expect(res.body.error[0]).to.have.keys('field', 'message');
          expect(res.body.error[0].field).to.deep.equal('address');
          expect(res.body.error[0].message).to.deep.equal('The address of your facility must contain atleast one letter');
          done();
        });
    });

    it('Should send a 422 error if facility address is shorter than 5 letters', (done) => {
      chai.request(app)
        .post(route)
        .send({
          name: 'Nnewi',
          street: 'NYBest',
          city: 'uouuty',
          country: 'NYC',
          address: 'ok',
          number_of_rooms: 8,
          available_space: 7,
          images: ['https://cloudinary.com/16x16/1.png', 'https://cloudinary.com/16x16/1.png'],
          description: 'Our services are the best'
        })
        .set('Authorization', adminToken)
        .end((error, res) => {
          expect(res).to.have.status(422);
          expect(res.body).to.have.keys('status', 'error');
          expect(res.body.status).to.deep.equal('error');
          expect(res.body.error).deep.to.be.an('array');
          expect(res.body.error[0]).to.have.keys('field', 'message');
          expect(res.body.error[0].field).to.deep.equal('address');
          expect(res.body.error[0].message).to.deep.equal('Too short: enter a minimum of 5 characters');
          done();
        });
    });

    it('Should send a 422 error if facility description is not provided', (done) => {
      chai.request(app)
        .post(route)
        .send({
          name: 'Nnewi',
          street: 'NYBest',
          city: 'uouuty',
          country: 'NYC',
          address: 'Imo Owerri',
          number_of_rooms: 8,
          available_space: 7,
          images: ['https://cloudinary.com/16x16/1.png', 'https://cloudinary.com/16x16/1.png']
        })
        .set('Authorization', adminToken)
        .end((error, res) => {
          expect(res).to.have.status(422);
          expect(res.body).to.have.keys('status', 'error');
          expect(res.body.status).to.deep.equal('error');
          expect(res.body.error).deep.to.be.an('array');
          expect(res.body.error[0]).to.have.keys('field', 'message');
          expect(res.body.error[0].field).to.deep.equal('description');
          expect(res.body.error[0].message).to.deep.equal('Enter few sentences to describe you facility');
          done();
        });
    });

    it('Should send a 422 error if facility description is shorter than 10 letters', (done) => {
      chai.request(app)
        .post(route)
        .send({
          name: 'Hotel De Lango',
          street: 'NYBest',
          city: 'uouuty',
          country: 'NYC',
          address: 'Nnewi North',
          number_of_rooms: 8,
          available_space: 7,
          images: ['https://cloudinary.com/16x16/1.png', 'https://cloudinary.com/16x16/1.png'],
          description: 'Our'
        })
        .set('Authorization', adminToken)
        .end((error, res) => {
          expect(res).to.have.status(422);
          expect(res.body).to.have.keys('status', 'error');
          expect(res.body.status).to.deep.equal('error');
          expect(res.body.error).deep.to.be.an('array');
          expect(res.body.error[0]).to.have.keys('field', 'message');
          expect(res.body.error[0].field).to.deep.equal('description');
          expect(res.body.error[0].message).to.deep.equal('Too short: enter a minimum of 10 characters');
          done();
        });
    });

    it('Should send a 422 error if facility description is not a string', (done) => {
      chai.request(app)
        .post(route)
        .send({
          name: 'Nnewi',
          street: 'NYBest',
          city: 'uouuty',
          country: 'NYC',
          address: 'Nnewi North',
          number_of_rooms: 8,
          available_space: 7,
          images: ['https://cloudinary.com/16x16/1.png', 'https://cloudinary.com/16x16/1.png'],
          description: 67342155432689765436
        })
        .set('Authorization', adminToken)
        .end((error, res) => {
          expect(res).to.have.status(422);
          expect(res.body).to.have.keys('status', 'error');
          expect(res.body.status).to.deep.equal('error');
          expect(res.body.error).deep.to.be.an('array');
          expect(res.body.error[0]).to.have.keys('field', 'message');
          expect(res.body.error[0].field).to.deep.equal('description');
          expect(res.body.error[0].message).to.deep.equal('The description of your facility must be a string');
          done();
        });
    });

    it('Should send a 422 error if facility description doesn\'t contain any letters', (done) => {
      chai.request(app)
        .post(route)
        .send({
          name: 'Nnewi',
          street: 'NYBest',
          city: 'uouuty',
          country: 'NYC',
          address: 'R87ouytedr',
          number_of_rooms: 8,
          available_space: 7,
          images: ['https://cloudinary.com/16x16/1.png', 'https://cloudinary.com/16x16/1.png'],
          description: '4565709876543267543'
        })
        .set('Authorization', adminToken)
        .end((error, res) => {
          expect(res).to.have.status(422);
          expect(res.body).to.have.keys('status', 'error');
          expect(res.body.status).to.deep.equal('error');
          expect(res.body.error).deep.to.be.an('array');
          expect(res.body.error[0]).to.have.keys('field', 'message');
          expect(res.body.error[0].field).to.deep.equal('description');
          expect(res.body.error[0].message).to.deep.equal('description of your facility must contain letters');
          done();
        });
    });

    it('Should send a 422 error if facility images is not an array or a string', (done) => {
      chai.request(app)
        .post(route)
        .send({
          name: 'Hotel De Opos',
          street: 'NYBest',
          city: 'uouuty',
          country: 'NYC',
          address: 'Nnewi North',
          number_of_rooms: 8,
          available_space: 7,
          images: 867354,
          description: 'Our Hotel is the best'
        })
        .set('Authorization', adminToken)
        .end((error, res) => {
          expect(res).to.have.status(422);
          expect(res.body).to.have.keys('status', 'error');
          expect(res.body.status).to.deep.equal('error');
          expect(res.body.error).deep.to.be.an('array');
          expect(res.body.error[0]).to.have.keys('field', 'message');
          expect(res.body.error[0].field).to.deep.equal('images');
          expect(res.body.error[0].message).to.deep.equal('Images must be an array');
          done();
        });
    });

    it('Should send a 422 error if facility number_of_rooms is not provided', (done) => {
      chai.request(app)
        .post(route)
        .send({
          name: 'Nnewi',
          street: 'NYBest',
          city: 'uouuty',
          country: 'NYC',
          address: 'Nnewi North',
          available_space: 7,
          images: ['https://cloudinary.com/16x16/1.png', 'https://cloudinary.com/16x16/1.png']
        })
        .set('Authorization', adminToken)
        .end((error, res) => {
          expect(res).to.have.status(422);
          expect(res.body).to.have.keys('status', 'error');
          expect(res.body.status).to.deep.equal('error');
          expect(res.body.error).deep.to.be.an('array');
          expect(res.body.error[0]).to.have.keys('field', 'message');
          expect(res.body.error[0].field).to.deep.equal('number_of_rooms');
          expect(res.body.error[0].message).to.deep.equal('Number of Rooms must not be empty');
          done();
        });
    });

    it('Should send a 422 error if facility number_of_rooms is not a number', (done) => {
      chai.request(app)
        .post(route)
        .send({
          name: 'Hotel De Lango',
          street: 'NYBest',
          city: 'uouuty',
          country: 'NYC',
          address: 'Nnewi North',
          number_of_rooms: 'r5',
          available_space: 7,
          images: ['https://cloudinary.com/16x16/1.png', 'https://cloudinary.com/16x16/1.png'],
          description: 'Our'
        })
        .set('Authorization', adminToken)
        .end((error, res) => {
          expect(res).to.have.status(422);
          expect(res.body).to.have.keys('status', 'error');
          expect(res.body.status).to.deep.equal('error');
          expect(res.body.error).deep.to.be.an('array');
          expect(res.body.error[0]).to.have.keys('field', 'message');
          expect(res.body.error[0].field).to.deep.equal('number_of_rooms');
          expect(res.body.error[0].message).to.deep.equal('Number of Rooms must be a a number');
          done();
        });
    });

    it('Should send a 422 error if facility available_space is not provided', (done) => {
      chai.request(app)
        .post(route)
        .send({
          name: 'Nnewi',
          street: 'NYBest',
          city: 'uouuty',
          country: 'NYC',
          address: 'Nnewi North',
          number_of_rooms: 5,
          images: ['https://cloudinary.com/16x16/1.png', 'https://cloudinary.com/16x16/1.png'],
          description: 'Our Facility is Bae'
        })
        .set('Authorization', adminToken)
        .end((error, res) => {
          expect(res).to.have.status(422);
          expect(res.body).to.have.keys('status', 'error');
          expect(res.body.status).to.deep.equal('error');
          expect(res.body.error).deep.to.be.an('array');
          expect(res.body.error[0]).to.have.keys('field', 'message');
          expect(res.body.error[0].field).to.deep.equal('available_space');
          expect(res.body.error[0].message).to.deep.equal('Available Space must not be empty');
          done();
        });
    });

    it('Should send a 422 error if facility available_space is not a number', (done) => {
      chai.request(app)
        .post(route)
        .send({
          name: 'Nnewi',
          street: 'NYBest',
          city: 'uouuty',
          country: 'NYC',
          address: 'Nnewi North',
          number_of_rooms: 7,
          available_space: 'T8',
          images: ['https://cloudinary.com/16x16/1.png', 'https://cloudinary.com/16x16/1.png'],
          description: 'Our Facility is Bae'
        })
        .set('Authorization', adminToken)
        .end((error, res) => {
          expect(res).to.have.status(422);
          expect(res.body).to.have.keys('status', 'error');
          expect(res.body.status).to.deep.equal('error');
          expect(res.body.error).deep.to.be.an('array');
          expect(res.body.error[0]).to.have.keys('field', 'message');
          expect(res.body.error[0].field).to.deep.equal('available_space');
          expect(res.body.error[0].message).to.deep.equal('Awailable space must be a a number');
          done();
        });
    });

    it('It Should Successfully Create Accomodation Facility with all valid fields', (done) => {
      chai.request(app)
        .post(route)
        .set('x-access-token', adminToken)
        .send(facility)
        .end((error, res) => {
          expect(res).to.have.status(201);
          expect(res.body).to.have.keys('status', 'data');
          expect(res.body.status).to.deep.equal('success');
          expect(res.body.data).to.be.an('object');
          done();
        });
    });

    it('fakes server error', (done) => {
      const req = { body: {} };
      const res = {
        status() { },
        send() { }
      };

      sinon.stub(res, 'status').returnsThis();

      FacilitiesController.createFacilities(req, res);
      (res.status).should.have.callCount(1);
      done();
    });

    it('fakes server error', (done) => {
      const req = { body: {} };
      const res = {
        status() {},
        send() {}
      };

      sinon.stub(res, 'status').returnsThis();

      FacilitiesController.createRoom(req, res);
      res.status.should.have.callCount(0);
      done();
    });
  });

  // Anyone can get all facilities on barefoot nomad
  describe('/GET Anyone can get all facilities on barefoot nomad', () => {
    afterEach('restore sinon', () => {
      sinon.restore();
    });

    it('It Should Successfully get all facilities on barefoot nomad', (done) => {
      chai.request(app)
        .get(route)
        .end((error, res) => {
          expect(res).to.have.status(200);
          expect(res.body).to.have.keys('status', 'data');
          expect(res.body.status).to.deep.equal('success');
          expect(res.body.data).to.be.an('array');
          done();
        });
    });

    it('It Should Return No facilities found if the table is empty', (done) => {
      sinon.stub(Facility, 'findAll').returns([]);
      chai.request(app)
        .get(route)
        .end((error, res) => {
          expect(res).to.have.status(404);
          expect(res.body).to.have.keys('status', 'message');
          expect(res.body.status).to.deep.equal('success');
          expect(res.body.message).to.deep.equal('There is no facilities listed on barefoot nomad at this time');
          done();
        });
    });

    it('fakes server error', (done) => {
      const req = { body: {} };
      const res = {
        status() { },
        send() { }
      };
      sinon.stub(res, 'status').returnsThis();
      FacilitiesController.getAllFacilities(req, res);
      res.status.should.have.callCount(0);
      done();
    });
  });
});
