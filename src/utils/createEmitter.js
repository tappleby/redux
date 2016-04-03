export default function createEmitter() {
  var currentListeners = []
  var nextListeners = currentListeners

  function ensureCanMutateNextListeners() {
    if (nextListeners === currentListeners) {
      nextListeners = currentListeners.slice()
    }
  }

  function subscribe(listener) {
    if (typeof listener !== 'function') {
      throw new Error('Expected listener to be a function.')
    }

    var isSubscribed = true

    ensureCanMutateNextListeners()
    nextListeners.push(listener)

    return function unsubscribe() {
      if (!isSubscribed) {
        return
      }

      isSubscribed = false

      ensureCanMutateNextListeners()
      var index = nextListeners.indexOf(listener)
      nextListeners.splice(index, 1)
    }
  }

  function notifyListeners() {
    var listeners = currentListeners = nextListeners
    for (var i = 0; i < listeners.length; i++) {
      listeners[i]()
    }
  }

  return { subscribe, notifyListeners }
}
