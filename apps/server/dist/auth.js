import jwt from 'jsonwebtoken';
const jwtSecret = () => process.env.JWT_SECRET ?? 'dev-secret-change-me';
export function signToken(payload) {
    return jwt.sign(payload, jwtSecret(), { expiresIn: '7d' });
}
export function optionalAuth(req, _res, next) {
    const token = getBearer(req);
    if (!token)
        return next();
    try {
        req.user = jwt.verify(token, jwtSecret());
    }
    catch {
        // Użytkownik publiczny nadal może korzystać z aplikacji.
    }
    next();
}
export function requireAuth(req, res, next) {
    const token = getBearer(req);
    if (!token)
        return res.status(401).json({ message: 'Brak tokenu logowania.' });
    try {
        req.user = jwt.verify(token, jwtSecret());
        next();
    }
    catch {
        res.status(401).json({ message: 'Nieprawidłowy albo wygasły token.' });
    }
}
export function requireAdmin(req, res, next) {
    requireAuth(req, res, () => {
        if (req.user?.role !== 'admin') {
            return res.status(403).json({ message: 'Brak uprawnień administratora.' });
        }
        next();
    });
}
export function requireManager(req, res, next) {
    requireAuth(req, res, () => {
        if (req.user?.role !== 'admin' && req.user?.role !== 'moderator') {
            return res.status(403).json({ message: 'Brak uprawnień administratora lub moderatora.' });
        }
        next();
    });
}
function getBearer(req) {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer '))
        return undefined;
    return header.slice('Bearer '.length);
}
