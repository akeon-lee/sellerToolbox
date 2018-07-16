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

    updateProducts: (productsQuery, userId, callback) => {
        const updated = [];

        // Update each product from the entire list. Push each product into the 'updated' array and pass it to the callback when we init the promise.
        // Currenty it updates even if there was no edit. Fix it so that it will only update items that have been edited.
        // Also shrink this code by formatting the Object on the client side.
        const updateProducts = () => {
            return new Promise((resolve, reject) => {
                productsQuery.forEach((product) => {
                    updated.push(product);
                    const update = {
                        sku: product.sku,
                        title: product.title,
                        quantity: {
                            quantity: product.quantity.quantity,
                            availableQuantity: product.quantity.quantity - product.quantity.pendingOrders,
                            alertQuantity: product.quantity.alertQuantity,
                            pendingOrders: product.quantity.pendingOrders,
                            neededQuantity: product.quantity.alertQuantity - product.quantity.availableQuantity > 0 ? product.quantity.alertQuantity - product.quantity.availableQuantity : 0
                        },
                        description: product.description,
                        price: {
                          purchasePrice: product.price.purchasePrice,
                          stockValue: product.price.stockValue
                        },
                        category: product.category,
                        variationGroup: product.variationGroup,
                        upc: product.upc,
                        barcode: product.barcode,
                        images: product.images,
                        condition: product.condition,
                        location: product.location,
                        detail: {
                            weight: product.detail.weight,
                            height: product.detail.height,
                            width: product.detail.width,
                            depth: product.detail.depth
                        },
                        binLocation: product.binLocation,
                        monitor: product.monitor,
                        modifiedDate: product.modifiedDate,
                    }
                    Products.update({_id: product.id, userId: userId}, update, (err, item) => {
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

    getProducts: (userId, callback) => {

        Products.find({userId: userId}).exec()
            .then((products) => {
                callback(null, products);
            })
        .catch((err) => {
            callback(err, null);
        });

    },

    deleteProducts: (products, userId, callback) => {

        if(typeof products === 'string') {
            // Get the products to be deleted from Angular then delete it.
            Products.find({_id: products, userId: userId}).remove().exec()
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

    linkItems(toolboxItem, marketplaceItem, userId, callback) {
        // Currently only works for Woo items. Adjust later for all marketplaces when integrating their apis
        Products.findOne({_id: toolboxItem._id, userId: userId}).exec()
            .then((item) => {
                // item.linked.woocommerce = [];
                // item.save();
                if(item.linked.woocommerce.length > 0) {
                    const index = item.linked.woocommerce.map(each => { return each.id }).indexOf(marketplaceItem.id);
                    if(index > -1) {
                        throw 'This item is already linked.';
                    } else {
                        // item.linked.woocommerce = [];
                        item.linked.woocommerce.push(marketplaceItem);
                        item.save((err, linked) => {
                            err ? callback(err, null) : callback(null, linked);
                        });
                    }
                } else {
                    item.linked.woocommerce.push(marketplaceItem);
                    item.save((err, linked) => {
                        err ? callback(err, null) : callback(null, linked);
                    });
                }
            })
        .catch((err) => {
            callback(err, null);
        })
    },

}
