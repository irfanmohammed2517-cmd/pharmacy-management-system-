import { Link, useNavigate } from "react-router-dom";

export default function Navbar() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user") || "null");

  const logout = () => {
    localStorage.removeItem("user");
    navigate("/login");
  };

  return (
    <nav>
      <Link to="/" className="brand">
        MediCare
      </Link>

      <div className="navlinks">
        <Link to="/medicines">Medicines</Link>

        {user && (
          <>
            <Link to="/cart">Cart</Link>
            <Link to="/orders">Orders</Link>
            <Link to="/profile">Profile</Link>

            {user.role === "admin" && <Link to="/admin">Admin</Link>}
          </>
        )}

        {!user ? (
          <>
            <Link to="/login">Login</Link>
            <Link to="/register">Register</Link>
          </>
        ) : (
          <button type="button" onClick={logout}>
            Logout
          </button>
        )}
      </div>
    </nav>
  );
}
