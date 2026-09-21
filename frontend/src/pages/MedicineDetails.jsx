import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../api";

export default function MedicineDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [medicine, setMedicine] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMedicine = async () => {
      try {
        const response = await api.get(`/medicines/${id}`);
        setMedicine(response.data);
      } catch (error) {
        console.error("Failed to load medicine:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMedicine();
  }, [id]);

  const addToCart = async () => {
    const user = JSON.parse(
      localStorage.getItem("user") || "null"
    );

    if (!user) {
      alert("Please login first");
      navigate("/login");
      return;
    }

    try {
      await api.post("/cart/add", {
        userId: user.id,
        medicineId: medicine._id,
        quantity: Number(quantity)
      });

      alert("Medicine added to cart");
      navigate("/cart");
    } catch (error) {
      console.error("Failed to add to cart:", error);

      alert(
        error.response?.data?.message ||
          "Failed to add medicine to cart"
      );
    }
  };

  if (loading) {
    return (
      <main className="page">
        <h2>Loading medicine...</h2>
      </main>
    );
  }

  if (!medicine) {
    return (
      <main className="page">
        <h2>Medicine not found</h2>
      </main>
    );
  }

  return (
    <main className="page">
      <div className="card">
        <h2>{medicine.name}</h2>

        <p>
          <strong>Brand:</strong> {medicine.brand}
        </p>

        <p>
          <strong>Category:</strong> {medicine.category}
        </p>

        <p>
          <strong>Description:</strong>{" "}
          {medicine.description || "No description available"}
        </p>

        <p>
          <strong>Price:</strong> ₹{medicine.price}
        </p>

        <p>
          <strong>Stock:</strong> {medicine.stock}
        </p>

        <p>
          <strong>Batch Number:</strong>{" "}
          {medicine.batchNumber}
        </p>

        <p>
          <strong>Prescription Required:</strong>{" "}
          {medicine.prescriptionRequired ? "Yes" : "No"}
        </p>

        {medicine.image && (
          <img
            src={medicine.image}
            alt={medicine.name}
            style={{
              maxWidth: "300px",
              maxHeight: "300px",
              objectFit: "contain"
            }}
          />
        )}

        <div style={{ marginTop: "20px" }}>
          <label>
            Quantity:
            <input
              type="number"
              min="1"
              max={medicine.stock}
              value={quantity}
              onChange={(e) =>
                setQuantity(Number(e.target.value))
              }
              style={{
                marginLeft: "10px",
                width: "80px"
              }}
            />
          </label>
        </div>

        <button
          type="button"
          className="btn"
          onClick={addToCart}
          disabled={medicine.stock <= 0}
          style={{ marginTop: "20px" }}
        >
          {medicine.stock > 0
            ? "Add to Cart"
            : "Out of Stock"}
        </button>
      </div>
    </main>
  );
}