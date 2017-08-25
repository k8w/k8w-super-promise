import SuperPromise from '../index';
import * as assert from 'assert';
describe('SuperPromise', function () {
    it('then', function (done) {
        new SuperPromise((rs, rj) => {
            rs('test1234');
        }).then(v => {
            assert.equal(v, 'test1234')
            done();
        })
    })

    it('catch', function (done) {
        new SuperPromise((rs, rj) => {
            rj('test1234');
        }).then(v => {
            assert.fail('should not run to here')
        }).catch(e => {
            assert.equal(e, 'test1234')
            done();
        })
    })

    it('catch->then', function (done) {
        new SuperPromise((rs, rj) => {
            rj('test1234');
        }).then(v => {
            return 'aaa';
        }).catch(e => {
            return e + '999'
        }).then(v => {
            assert.equal(v, 'test1234999')
            done();
        })
    })

    it('catch->catch', function (done) {
        new SuperPromise((rs, rj) => {
            rj('test1234');
        }).then(v => { }).catch(e => { }).catch(v => {
            assert.fail('should not run here')
        }).then(v => {
            done();
        })
    })

    it('always (resolve & delay)', function (done) {
        new SuperPromise((rs, rj) => {
            setTimeout(() => {
                rs('test1234');
            }, 0)
        }).always(() => {
            done();
        }).then(v => {
        }).catch(e => {
        })
    })

    it('always (resolve & no delay)', function (done) {
        new SuperPromise((rs, rj) => {
            rs('test1234');
        }).always(() => {
            done();
        }).then(v => {
        }).catch(e => {
        })
    })

    it('always (reject & delay)', function (done) {
        new SuperPromise((rs, rj) => {
            setTimeout(() => {
                rj('test1234');
            }, 0)
        }).always(() => {
            done();
        }).then(v => {
        }).catch(e => {
        })
    })

    it('always (reject & no delay)', function (done) {
        new SuperPromise((rs, rj) => {
            rj('test1234');
        }).always(() => {
            done();
        }).then(v => {
        }).catch(e => {
        })
    })

    it('cancel (delay)', function () {
        //resolve
        new SuperPromise((rs, rj) => {
            setTimeout(() => {
                rs()
            }, 10)
        }).always(() => {
            assert.fail('should not run here (canceled)')
        }).then(() => {
            assert.fail('should not run here (canceled)')
        }).catch(() => {
            assert.fail('should not run here (canceled)')
        }).cancel();

        //reject
        new SuperPromise((rs, rj) => {
            setTimeout(() => {
                rj()
            }, 10)
        }).always(() => {
            assert.fail('should not run here (canceled)')
        }).then(() => {
            assert.fail('should not run here (canceled)')
        }).catch(() => {
            assert.fail('should not run here (canceled)')
        }).cancel();
    })

    it('cancel (no delay)', function () {
        //resolve
        let p = new SuperPromise((rs, rj) => {
            rs()
        });
        p.cancel();
        p.always(() => {
            assert.fail('should not run here (canceled)')
        }).then(() => {
            assert.fail('should not run here (canceled)')
        }).catch(() => {
            assert.fail('should not run here (canceled)')
        }).cancel();

        //reject
        p = new SuperPromise((rs, rj) => {
            rj()
        });
        p.cancel();
        p.always(() => {
            assert.fail('should not run here (canceled)')
        }).then(() => {
            assert.fail('should not run here (canceled)')
        }).catch(() => {
            assert.fail('should not run here (canceled)')
        }).cancel();
    })
})