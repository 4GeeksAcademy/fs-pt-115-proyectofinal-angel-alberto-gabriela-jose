
import { useEffect, useState } from "react";

export const SingIn = () => {
    const { store, dispatch } = useGlobalReducer()
    const [user, setUser] = useState({
        email: "",
        password: ""
    })
}

const handleInputChange = (e) => {
    const { name, value } = e.target
    setUser({
        ...user,
        [name]: value

    })
}

const handleSubmit = (e) => {
    e.preventDefault()
    console.log("Datos de login:", user)
}

return (
    <div className="col-12 col-md-8 d-flex flex-column justify-content-right p-4 mx-auto">
        <div className="container mt-5">
            <h2>Iniciar Sesión</h2>
            <form onSubmit={handleSubmit}>
                <div className="mb-3">
                    <label className="form-label " htmlFor="">Email:</label>
                    <input
                        type="email"
                        className="form-control"
                        name="email"
                        value={user.email}
                        onChange={handleChange}
                        required
                    />
                </div>
            </form>
        </div>
    </div>
)