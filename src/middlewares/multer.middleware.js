import multer from 'multer';

const setupMulter = () => {
    const storage = multer.memoryStorage(); // Store file in memory as a buffer
    return multer({ storage });
};

export default setupMulter();
