'use strict'

const Products = require('../../models/products');

module.exports = {

    addProducts: (productsQuery, callback) => {
        const created = [];

        // Create each product that was submitted. Push each product into the 'created' array and pass it to the callback when we init the promise.
        const createProducts = () => {
            return new Promise((resolve, reject) => {

                productsQuery.forEach((product) => {
                    created.push(product);
                    const createProducts = Products(product);
                    createProducts.save((err, response) => {
                        err ? reject(err) : resolve();
                    })
                });
            });
        }

        // Init the promise.
        createProducts()
            .then(() => {
                callback(null, created);
            })
        .catch((err) => {
            callback(err, null);
        });

    },

    updateProducts: (productsQuery, callback) => {
        const updated = [];

        // Update each product from the entire list. Push each product into the 'updated' array and pass it to the callback when we init the promise.
        // Currenty it updates even if there was no edit. Fix it so that it will only update items that have been edited.
        const updateProducts = () => {
            return new Promise((resolve, reject) => {
                productsQuery.forEach((product) => {
                    updated.push(product);
                    const update = {
                        sku: product.sku,
                        title: product.title,
                        quantity: {
                            availableQuantity: product.quantity.availableQuantity,
                            alertQuantity: product.quantity.alertQuantity,
                            pendingOrders: product.quantity.pendingOrders,
                            neededQuantity: product.quantity.alertQuantity - product.quantity.availableQuantity
                        },
                        description: product.description,
                        upc: product.upc,
                        barcode: product.barcode,
                        images: product.images,
                        condition: product.condition,
                        binLocation: product.binLocation
                    }
                    Products.update({_id: product.id}, update, (err, item) => {
                       err ? reject(err) : resolve(item);
                    });
                });
            });
        }
        updateProducts()
            .then(() => {
                callback(null, updated);
            })
        .catch((err) => {
            callback(err, null);
        });

    },

    getProducts: (callback) => {

        Products.find().exec()
            .then((products) => {
                callback(null, products);
            })
        .catch((err) => {
            callback(err, null);
        });

    },

    deleteProducts: (products, callback) => {

        if(typeof products === 'string') {
            // Get the products to be deleted from Angular then delete it.
            Products.find({_id: products}).remove().exec()
                .then((deleted) => {
                    callback(null, deleted);
            }).catch((err) => {
                callback(err, null);
            });
        } else {

            const deleteMultiProducts = () => {
                return new Promise((resolve, reject) => {
                    products.forEach((product) => {
                        Products.find({_id: product}).remove().exec()
                            .then((product) => {
                                resolve(product);
                            })
                        .catch((err) => {
                            reject(err);
                        });
                    });
                });
            };

            deleteMultiProducts()
                .then((deleted) => {
                    callback(null, deleted);
                })
            .catch((err) => {
                callback(err, null);
            });
        }

    },

}
