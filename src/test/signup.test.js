import chai from 'chai';
import chaiHttp from 'chai-http';
import sgMail from '@sendgrid/mail';
import sinon from 'sinon';
import Sinonchai from 'sinon-chai';

import app from '../index';
import UsersController from '../controllers/user.controller';

chai.use(chaiHttp);
chai.should();
chai.use(Sinonchai);
const { expect } = chai;


const user = {
  email: 'chiomadans@gmail.com',
  first_name: 'Ejike',
  last_name: 'Chiemerie',
  password: 'secret123',
  role: 'requester',
  gender: 'female',
  birth_date: '02-02-2019',
  preferred_language: 'english',
  preferred_currency: 'USD',
  location: 'lagos',
};

describe('Users', () => {
  // Test for creating new user
  describe('/POST register users', () => {
    it('it should Signup a user and generate a token', (done) => {
      const stub = sinon.stub(sgMail, 'send').callsFake(() => 'done');

      chai.request(app)
        .post('/api/v1/auth/signup')
        .send(user)
        .end((err, res) => {
          user.token = res.body.data.token;
          res.should.have.status(201);
          res.body.should.be.an('object');
          res.body.should.have.property('status').eql('success');
          res.body.should.have.property('data');
          res.body.data.should.have.property('first_name');
          res.body.data.should.have.property('last_name');
          res.body.data.should.have.property('email');
          stub.called.should.be.true;
          stub.restore();
          done();
        });
    });
  });

  it('fakes server error for signup', (done) => {
    const req = { body: {} };
    const res = {
      status() {},
      send() {}
    };

    sinon.stub(res, 'status').returnsThis();

    UsersController.signup(req, res);
    res.status.should.have.callCount(0);
    done();
  });

  it('fakes server error for signin', (done) => {
    const req = { body: {} };
    const res = {
      status() { },
      send() { }
    };

    sinon.stub(res, 'status').returnsThis();

    UsersController.signin(req, res);
    res.status.should.have.callCount(0);
    done();
  });

  it('fakes server error for user roles', (done) => {
    const req = { body: {} };
    const res = {
      status() {},
      send() {}
    };

    sinon.stub(res, 'status').returnsThis();

    UsersController.setUserRole(req, res);
    res.status.should.have.callCount(0);
    done();
  });

  it('fakes server error for auth login', (done) => {
    const req = { body: {} };
    const res = {
      status() {},
      send() {}
    };

    sinon.stub(res, 'status').returnsThis();

    UsersController.oauthSignin(req, res);
    res.status.should.have.callCount(1);
    done();
  });

  describe('/Validate Signup Inputs', () => {
    it('should not register a new user with an already existing email', (done) => {
      chai.request(app)
        .post('/api/v1/auth/signup')
        .send(user)
        .end((err, res) => {
          expect(res).to.have.status(409);
          expect(res.body).to.be.an('object');
          expect(res.body.message).to.equal('user already registered');
          done();
        });
    });
  });
  it('it should not signup invalid lastname', (done) => {
    chai
      .request(app)
      .post('/api/v1/auth/signup')
      .send({
        email: 'chiomadans@gmail.com',
        first_name: 'Ejike',
        last_name: '',
        password: 'secret123',
        role: 'requester',
        gender: 'female',
        birth_date: '02-02-2019',
        preferred_language: 'english',
        preferred_currency: 'USD',
        location: 'lagos',
      })
      .end((err, res) => {
        res.should.have.status(422);
        res.body.should.have.property('status').to.equals('error');

        done();
      });
  });

  it('it should not signup invalid firstname', (done) => {
    chai
      .request(app)
      .post('/api/v1/auth/signup')
      .send({
        email: 'chiomadans@gmail.com',
        first_name: '',
        last_name: 'Ejike',
        password: 'secret123',
        role: 'requester',
        gender: 'female',
        birth_date: '02-02-2019',
        preferred_language: 'english',
        preferred_currency: 'USD',
        location: 'lagos',
      })
      .end((err, res) => {
        res.should.have.status(422);
        res.body.should.have.property('status').to.equals('error');
        done();
      });
  });

  it('it should not signup invalid password', (done) => {
    chai
      .request(app)
      .post('/api/v1/auth/signup')
      .send({
        email: 'chiomadans@gmail.com',
        first_name: 'Ejike',
        last_name: 'ddd',
        password: 'secre t123',
        role: 'requester',
        gender: 'female',
        birth_date: '02-02-2019',
        preferred_language: 'english',
        preferred_currency: 'USD',
        location: 'lagos',
      })
      .end((err, res) => {
        res.should.have.status(422);
        res.body.should.have.property('status').to.equals('error');
        done();
      });
  });

  it('it should not signup invalid email', (done) => {
    chai
      .request(app)
      .post('/api/v1/auth/signup')
      .send({
        email: 'chiomadansgmail.com',
        first_name: 'Ejike',
        last_name: 'ddd',
        password: 'secret123',
        role: 'requester',
        gender: 'female',
        birth_date: '02-02-2019',
        preferred_language: 'english',
        preferred_currency: 'USD',
        location: 'lagos',
      })
      .end((err, res) => {
        res.should.have.status(422);
        res.body.should.have.property('status').to.equals('error');
        done();
      });
  });
});

describe('/Post Requests', () => {
  it('It should fail to reset password with an invalid mail', (done) => {
    chai
      .request(app)
      .post('/api/v1/password-reset')
      .send({ email: 'd@ff' })
      .end((err, res) => {
        res.should.have.status(404);
        res.body.should.have.property('status').to.equals('error');
        res.body.should.have
          .property('message')
          .to.equals('user email not found');

        done();
      });
  });

  it('It should receive a mail ', (done) => {
    chai
      .request(app)
      .post('/api/v1/password-reset')
      .send({ email: 'john_doe@email.com' })
      .end((err, res) => {
        res.should.have.status(200);
        res.body.should.have.property('status').to.equals('success');
        res.body.should.have.property('data').to.be.an('object');

        done();
      });
  });
});
