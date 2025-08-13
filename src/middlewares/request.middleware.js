export const decodeQueryParams = (req, res, next) => {
    if (req.query && req.query.filters) {
        req.query.filters = JSON.parse(decodeURIComponent(req.query.filters));
    }

    if (req.query && req.query.attributes) {
        req.query.attributes = JSON.parse(
            decodeURIComponent(req.query.attributes)
        );
    }

    if (req.query && req.query.groupBy) {
        req.query.groupBy = JSON.parse(decodeURIComponent(req.query.groupBy));
    }

    next();
};
