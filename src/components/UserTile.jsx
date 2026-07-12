function UserTile({ user, selected, onClick }) {
  const initial = user.FullName?.trim()?.charAt(0)?.toUpperCase() || "?";

  return (
    <button className={`user-tile ${selected ? "active" : ""}`} onClick={onClick}>
      <div className="user-avatar">{initial}</div>

      <div className="user-tile-info">
        <strong>{user.FullName}</strong>
        <span>{user.RoleName}</span>
      </div>
    </button>
  );
}

export default UserTile;