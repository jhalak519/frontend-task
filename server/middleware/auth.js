const jwt = require('jsonwebtoken');

module.exports = function (req, res, next) {
    // Get token from header
    const token = req.header('Authorization');

    // Check if not token
    if (!token) {
        return res.status(401).json({ msg: 'No token, authorization denied' });
    }

    // Verify token
    try {
        // Standard Bearer token format check could be added here, but keeping it simple as per requirements
        // Assuming "Bearer <token>" or just "<token>"
        const bearer = token.startsWith('Bearer ') ? token.slice(7, token.length) : token;

        const decoded = jwt.verify(bearer, process.env.JWT_SECRET);

        req.user = decoded.user;
        next();
    } catch (err) {
        res.status(401).json({ msg: 'Token is not valid' });
    }
};
