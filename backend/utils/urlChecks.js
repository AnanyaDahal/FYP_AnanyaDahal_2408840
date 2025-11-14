exports.validateURL = (url) => {
    const regex = /(https?:\/\/)?([\w\-])+\.([\w\-])+[\w\-\._~:/?#[\]@!$&'()*+,;=.]+/;
    return regex.test(url);
};

exports.checkHTTPS = (url) => url.startsWith("https://");

exports.checkLength = (url) => {
    if (url.length > 75) return "long";
    if (url.length > 40) return "medium";
    return "short";
};

exports.detectSuspiciousChars = (url) => {
    const suspicious = ["@", "%", "$", "<", ">", "?", "=", "\\"];
    return suspicious.filter(char => url.includes(char));
};
