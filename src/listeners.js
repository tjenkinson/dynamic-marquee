function deferException(callback) {
  try {
    return callback();
  } catch (e) {
    window.setTimeout(() => {
      throw e;
    }, 0);
  }
}

export function Listeners() {
  const listeners = [];
  return {
    add: (listener) => {
      listeners.push(listener);
      return () => {
        const index = listeners.indexOf(listener);
        if (index >= 0) listeners.splice(index, 1);
      };
    },
    invoke: () => {
      [...listeners].forEach((callback) => deferException(() => callback()));
    },
  };
}
