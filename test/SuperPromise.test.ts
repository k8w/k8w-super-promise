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

    it('cancel (delay)', function (done) {
        let canceled = false;
        //resolve
        let p = new SuperPromise<void>((rs, rj) => {
            setTimeout(() => {
                rs()
            }, 10)
        }).always(() => {
            assert.fail('should not run here (canceled)')
        }).then(() => {
            assert.fail('should not run here (canceled)')
        }).catch(() => {
            assert.fail('should not run here (canceled)')
        }).onCancel(() => {
            canceled = true;
        });
        assert.equal(p.cancel(), true)

        //reject
        let canceled1 = false;
        p = new SuperPromise((rs, rj) => {
            setTimeout(() => {
                rj(new Error('x'))
            }, 10)
        }).always(() => {
            assert.fail('should not run here (canceled)')
        }).then(() => {
            assert.fail('should not run here (canceled)')
        }).catch(() => {
            assert.fail('should not run here (canceled)')
        }).onCancel(() => {
            canceled1 = true;
        });
        p.cancel();
        assert.equal(p.cancel(), true)

        setTimeout(() => {
            assert.equal(canceled, true)
            assert.equal(canceled1, true)
            done();
        }, 20)
    })

    it('cancel (no delay)', function (done) {
        let canceled = false, canceled1 = false;

        //resolve
        let p = new SuperPromise((rs, rj) => {
            rs(new Error('x'))
        });
        let a1 = false, t1 = false;
        p.onCancel(() => {
            canceled = true;
        });
        assert.equal(p.cancel(), false);
        p.always(() => {
            a1 = true;
        }).then(() => {
            t1 = true;
        }).catch(() => {
            assert.fail('should not run here (canceled)')
        }).cancel();

        //reject
        let a2 = false, c2 = false;
        p = new SuperPromise((rs, rj) => {
            rj(new Error('x'))
        });
        p.onCancel(() => {
            canceled1 = true;
        });
        assert.equal(p.cancel(), false);
        p.always(() => {
            a2 = true;
        }).then(() => {
            assert.fail('should not run here (canceled)')
        }).catch(() => {
            c2 = true;
        }).cancel();

        setTimeout(() => {
            assert.equal(a1, true);
            assert.equal(t1, true);
            assert.equal(a2, true);
            assert.equal(c2, true);
            assert.equal(canceled, false);
            assert.equal(canceled1, false);
            done();
        }, 0)
    })

    it('await and catch', async function () {
        let value = await (new SuperPromise((rs, rj) => {
            setTimeout(() => {
                console.log('doing')
                rj('66666')
            }, 20);
        }).catch(e => {
            console.log('catched', e);
            return '666';
        }))

        assert.equal(value, '666')
    })

    it('Can only rs 1 time', async function () {
        let n = 0;
        await (new SuperPromise<number>(rs => {
            setTimeout(() => {
                rs(1);
            }, 0);
            setTimeout(() => {
                rs(1);
            }, 100);
            setTimeout(() => {
                rs(1);
            }, 200);
        })).then(v => {
            n += v;
        });
        assert.equal(n, 1);
    })

    it('Can only rj 1 time', async function () {
        let n = 0;
        await (new SuperPromise<number>((rs, rj) => {
            setTimeout(() => {
                rj(1);
            }, 0);
            setTimeout(() => {
                rj(1);
            }, 100);
            setTimeout(() => {
                rj(1);
            }, 200);
        })).catch(v => {
            n += v as any as number;
        });
        assert.equal(n, 1);
    })

    it('memory leak', async function () {
        global.gc();
        let usage = process.memoryUsage();

        for (let i = 0; i < 1000000; ++i) {
            let pm = new SuperPromise<any>((rs, rj) => {
                setTimeout(() => {

                }, 1000)
            });
            pm.onCancel(() => { });
            setTimeout(() => {
                pm.cancel();
            }, 500)
        }
        await new Promise(rs => {
            setTimeout(rs, 1500);
        });

        global.gc();
        let usage1 = process.memoryUsage();
        console.log(usage, usage1);
        assert.ok(usage1.heapUsed - usage.heapUsed <= 10);
    })
})