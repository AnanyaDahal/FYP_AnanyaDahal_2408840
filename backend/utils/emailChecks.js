exports.detectKeywords = (text) => {
    const keywords = ["urgent", "verify", "password", "bank", "lottery", "click"];
    return keywords.filter(word => text.toLowerCase().includes(word));
};

exports.detectFakeSender = (email) => {
    return email.includes("@gmail.com.co") || email.includes("@hotmail.co.uk.co");
};

exports.extractLinks = (text) => {
    const regex = /(https?:\/\/[^\s]+)/g;
    return text.match(regex) || [];
};
