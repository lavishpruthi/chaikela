/** Password hashing, signed expiring tokens and role checks. */
class Auth {
  static secret() {
    const p = PropertiesService.getScriptProperties();
    let s = p.getProperty("SECRET");
    if (!s) {
      s = Utilities.getUuid() + Utilities.getUuid();
      p.setProperty("SECRET", s);
    }
    return s;
  }
  static hash(v, salt) {
    return Utilities.base64Encode(
      Utilities.computeDigest(
        Utilities.DigestAlgorithm.SHA_256,
        v + ":" + salt + ":" + Auth.secret(),
      ),
    );
  }
  static sign(uid) {
    const p = uid + "|" + (Date.now() + TOKEN_HOURS * 3600000);
    return (
      Utilities.base64EncodeWebSafe(p) +
      "." +
      Utilities.base64EncodeWebSafe(
        Utilities.computeHmacSha256Signature(p, Auth.secret()),
      )
    );
  }
  static verify(tok) {
    try {
      const [b, sig] = String(tok).split("."),
        p = Utilities.newBlob(
          Utilities.base64DecodeWebSafe(b),
        ).getDataAsString(),
        [uid, exp] = p.split("|");
      if (
        Number(exp) > Date.now() &&
        Utilities.base64EncodeWebSafe(
          Utilities.computeHmacSha256Signature(p, Auth.secret()),
        ) === sig
      )
        return uid;
    } catch (e) {}
    throw new AppError("Session expired. Please log in again.");
  }
  static roleCode(roleId) {
    return Object.keys(ROLES).find((k) => ROLES[k] === roleId);
  }
  /** Returns {user, role}. `roles` = array of allowed role codes, or ['*'] for any logged-in user. */
  static user(token, roles) {
    const u = new UserRepo().find(Auth.verify(token));
    if (!u || u.status !== "active")
      throw new AppError("Session expired. Please log in again.");
    const role = Auth.roleCode(u.roleId);
    if (roles[0] !== "*" && !roles.includes(role))
      throw new AppError("You do not have access to this action");
    return { user: u, role };
  }
}
