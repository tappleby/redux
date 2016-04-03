import expect from 'expect'
import createEmitter from '../../src/utils/createEmitter'

describe('Utils', () => {
  describe('createEmitter', () => {
    it('supports multiple subscriptions', () => {
      const emitter = createEmitter()
      const listenerA = expect.createSpy(() => {})
      const listenerB = expect.createSpy(() => {})

      let unsubscribeA = emitter.subscribe(listenerA)
      emitter.notifyListeners()
      expect(listenerA.calls.length).toBe(1)
      expect(listenerB.calls.length).toBe(0)

      emitter.notifyListeners()
      expect(listenerA.calls.length).toBe(2)
      expect(listenerB.calls.length).toBe(0)

      const unsubscribeB = emitter.subscribe(listenerB)
      expect(listenerA.calls.length).toBe(2)
      expect(listenerB.calls.length).toBe(0)

      emitter.notifyListeners()
      expect(listenerA.calls.length).toBe(3)
      expect(listenerB.calls.length).toBe(1)

      unsubscribeA()
      expect(listenerA.calls.length).toBe(3)
      expect(listenerB.calls.length).toBe(1)

      emitter.notifyListeners()
      expect(listenerA.calls.length).toBe(3)
      expect(listenerB.calls.length).toBe(2)

      unsubscribeB()
      expect(listenerA.calls.length).toBe(3)
      expect(listenerB.calls.length).toBe(2)

      emitter.notifyListeners()
      expect(listenerA.calls.length).toBe(3)
      expect(listenerB.calls.length).toBe(2)

      unsubscribeA = emitter.subscribe(listenerA)
      expect(listenerA.calls.length).toBe(3)
      expect(listenerB.calls.length).toBe(2)

      emitter.notifyListeners()
      expect(listenerA.calls.length).toBe(4)
      expect(listenerB.calls.length).toBe(2)
    })

    it('only removes listener once when unsubscribe is called', () => {
      const emitter = createEmitter()
      const listenerA = expect.createSpy(() => {})
      const listenerB = expect.createSpy(() => {})

      const unsubscribeA = emitter.subscribe(listenerA)
      emitter.subscribe(listenerB)

      unsubscribeA()
      unsubscribeA()

      emitter.notifyListeners()
      expect(listenerA.calls.length).toBe(0)
      expect(listenerB.calls.length).toBe(1)
    })

    it('only removes relevant listener when unsubscribe is called', () => {
      const emitter = createEmitter()
      const listener = expect.createSpy(() => {})

      emitter.subscribe(listener)
      const unsubscribeSecond = emitter.subscribe(listener)

      unsubscribeSecond()
      unsubscribeSecond()

      emitter.notifyListeners()
      expect(listener.calls.length).toBe(1)
    })

    it('supports removing a subscription within a subscription', () => {
      const emitter = createEmitter()
      const listenerA = expect.createSpy(() => {})
      const listenerB = expect.createSpy(() => {})
      const listenerC = expect.createSpy(() => {})

      emitter.subscribe(listenerA)
      const unSubB = emitter.subscribe(() => {
        listenerB()
        unSubB()
      })
      emitter.subscribe(listenerC)

      emitter.notifyListeners()
      emitter.notifyListeners()

      expect(listenerA.calls.length).toBe(2)
      expect(listenerB.calls.length).toBe(1)
      expect(listenerC.calls.length).toBe(2)
    })

    it('delays unsubscribe until the end of current notifyListeners', () => {
      const emitter = createEmitter()

      const unsubscribeHandles = []
      const doUnsubscribeAll = () => unsubscribeHandles.forEach(
        unsubscribe => unsubscribe()
      )

      const listener1 = expect.createSpy(() => {})
      const listener2 = expect.createSpy(() => {})
      const listener3 = expect.createSpy(() => {})

      unsubscribeHandles.push(emitter.subscribe(() => listener1()))
      unsubscribeHandles.push(emitter.subscribe(() => {
        listener2()
        doUnsubscribeAll()
      }))
      unsubscribeHandles.push(emitter.subscribe(() => listener3()))

      emitter.notifyListeners()
      expect(listener1.calls.length).toBe(1)
      expect(listener2.calls.length).toBe(1)
      expect(listener3.calls.length).toBe(1)

      emitter.notifyListeners()
      expect(listener1.calls.length).toBe(1)
      expect(listener2.calls.length).toBe(1)
      expect(listener3.calls.length).toBe(1)
    })

    it('delays subscribe until the end of current notifyListeners', () => {
      const emitter = createEmitter()

      const listener1 = expect.createSpy(() => {})
      const listener2 = expect.createSpy(() => {})
      const listener3 = expect.createSpy(() => {})

      let listener3Added = false
      const maybeAddThirdListener = () => {
        if (!listener3Added) {
          listener3Added = true
          emitter.subscribe(() => listener3())
        }
      }

      emitter.subscribe(() => listener1())
      emitter.subscribe(() => {
        listener2()
        maybeAddThirdListener()
      })

      emitter.notifyListeners()
      expect(listener1.calls.length).toBe(1)
      expect(listener2.calls.length).toBe(1)
      expect(listener3.calls.length).toBe(0)

      emitter.notifyListeners()
      expect(listener1.calls.length).toBe(2)
      expect(listener2.calls.length).toBe(2)
      expect(listener3.calls.length).toBe(1)
    })

    it('uses the last snapshot of subscribers during nested notifyListeners', () => {
      const emitter = createEmitter()

      const listener1 = expect.createSpy(() => {})
      const listener2 = expect.createSpy(() => {})
      const listener3 = expect.createSpy(() => {})
      const listener4 = expect.createSpy(() => {})

      let unsubscribe4
      const unsubscribe1 = emitter.subscribe(() => {
        listener1()
        expect(listener1.calls.length).toBe(1)
        expect(listener2.calls.length).toBe(0)
        expect(listener3.calls.length).toBe(0)
        expect(listener4.calls.length).toBe(0)

        unsubscribe1()
        unsubscribe4 = emitter.subscribe(listener4)
        emitter.notifyListeners()

        expect(listener1.calls.length).toBe(1)
        expect(listener2.calls.length).toBe(1)
        expect(listener3.calls.length).toBe(1)
        expect(listener4.calls.length).toBe(1)
      })
      emitter.subscribe(listener2)
      emitter.subscribe(listener3)

      emitter.notifyListeners()
      expect(listener1.calls.length).toBe(1)
      expect(listener2.calls.length).toBe(2)
      expect(listener3.calls.length).toBe(2)
      expect(listener4.calls.length).toBe(1)

      unsubscribe4()
      emitter.notifyListeners()
      expect(listener1.calls.length).toBe(1)
      expect(listener2.calls.length).toBe(3)
      expect(listener3.calls.length).toBe(3)
      expect(listener4.calls.length).toBe(1)
    })
  })
})
