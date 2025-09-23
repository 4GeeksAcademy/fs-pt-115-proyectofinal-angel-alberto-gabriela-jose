export const initialStore = () => {
  return {
    // Nuevo estado de autenticación
    auth: {
      token: localStorage.getItem("authToken") || null,
      user: {},
      //  JSON.parse(localStorage.getItem('user')) || null,
    },
    message: null,
    todos: [
      {
        id: 1,
        title: "Make the bed",
        background: null,
      },
      {
        id: 2,
        title: "Do my homework",
        background: null,
      },
    ],
  };
};

export default function storeReducer(store, action = {}) {
  switch (action.type) {
    case "set_hello":
      return {
        ...store,
        message: action.payload,
      };

    case "add_task":
      const { id, color } = action.payload;
      return {
        ...store,
        todos: store.todos.map((todo) =>
          todo.id === id ? { ...todo, background: color } : todo
        ),
      };

    // Nuevas acciones para manejar el login y logout
    case "LOGIN_SUCCESS":
      localStorage.setItem("authToken", action.payload.token);
      localStorage.setItem("user", JSON.stringify(action.payload.user));
      return {
        ...store,
        auth: {
          token: action.payload.token,
          user: action.payload.user,
        },
      };

    case "LOGOUT":
      localStorage.removeItem("authToken");
      localStorage.removeItem("user");
      return {
        ...store,
        auth: {
          token: null,
          user: null,
        },
      };

    default:
      return store;
  }
}
