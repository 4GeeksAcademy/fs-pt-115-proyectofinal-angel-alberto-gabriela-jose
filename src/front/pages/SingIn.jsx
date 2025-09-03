import { useState } from "react";
import useGlobalReducer from "../hooks/useGlobalReducer.jsx";

export const SingIn = () => {
    const { store, dispatch } = useGlobalReducer();

    const [user, setUser] = useState({
        email: "",
        password: ""
    });


    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setUser({
            ...user,
            [name]: value
        });
    };


    const handleSubmit = (e) => {
        e.preventDefault();
        console.log("Datos de login:", user);
    };

    return (
        <div className="container mt-5">
            <form onSubmit={handleSubmit}>
                <div className="mb-3">
                    <label className="form-label" htmlFor="email">Email:</label>
                    <input
                        id="email"
                        type="email"
                        className="form-control"
                        name="email"
                        value={user.email}
                        onChange={handleInputChange}
                        required
                    />
                </div>

                <div className="mb-3">
                    <label className="form-label" htmlFor="password">Password:</label>
                    <input
                        id="password"
                        type="password"
                        className="form-control"
                        name="password"
                        value={user.password}
                        onChange={handleInputChange}
                        required
                    />
                </div>

                <button type="submit" className="btn btn-primary">Submit</button>
            </form>
        </div>
    );
};
