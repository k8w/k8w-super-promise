import * as assert from 'assert';
import { SuperPromise } from '../src/index';
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

    it('finally (resolve & delay)', function (done) {
        new SuperPromise((rs, rj) => {
            setTimeout(() => {
                rs('test1234');
            }, 0)
        }).finally(() => {
            done();
        }).then(v => {
        }).catch(e => {
        })
    })

    it('finally (resolve & no delay)', function (done) {
        new SuperPromise((rs, rj) => {
            rs('test1234');
        }).finally(() => {
            done();
        }).then(v => {
        }).catch(e => {
        })
    })

    it('finally (reject & delay)', function (done) {
        new SuperPromise((rs, rj) => {
            setTimeout(() => {
                rj('test1234');
            }, 0)
        }).finally(() => {
            done();
        }).then(v => {
        }).catch(e => {
        })
    })

    it('finally (reject & no delay)', function (done) {
        new SuperPromise((rs, rj) => {
            rj('test1234');
        }).finally(() => {
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
        }).finally(() => {
            assert.fail('should not run here (canceled)')
        }).then(() => {
            assert.fail('should not run here (canceled)')
        }).catch(() => {
            assert.fail('should not run here (canceled)')
        });
        p.onAbort = () => {
            canceled = true;
        };
        assert.equal(p.abort(), true)

        //reject
        let canceled1 = false;
        p = new SuperPromise((rs, rj) => {
            setTimeout(() => {
                rj(new Error('x'))
            }, 10)
        }).finally(() => {
            assert.fail('should not run here (canceled)')
        }).then(() => {
            assert.fail('should not run here (canceled)')
        }).catch(() => {
            assert.fail('should not run here (canceled)')
        });
        p.onAbort = () => {
            canceled1 = true;
        };
        p.abort();
        assert.equal(p.abort(), true)

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
        p.onAbort = () => {
            canceled = true;
        };
        assert.equal(p.abort(), false);
        p.finally(() => {
            a1 = true;
        }).then(() => {
            t1 = true;
        }).catch(() => {
            assert.fail('should not run here (canceled)')
        }).abort();

        //reject
        let a2 = false, c2 = false;
        p = new SuperPromise((rs, rj) => {
            rj(new Error('x'))
        });
        p.onAbort = () => {
            canceled1 = true;
        };
        assert.equal(p.abort(), false);
        p.finally(() => {
            a2 = true;
        }).then(() => {
            assert.fail('should not run here (canceled)')
        }).catch(() => {
            c2 = true;
        }).abort();

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
            pm.onAbort = () => { };
            setTimeout(() => {
                pm.abort();
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