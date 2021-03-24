const mongoose = require('mongoose');
const { StaticData, StaticSchema } = require('../models/StaticsData');
const StaticClassNames = require('../models/StaticsClassNames');
const verifyToken = require('../token/verifyToken');

exports.getClasses = (req, res) => {
  try {
    verifyToken.checkToken(req.query.token, async (result, data) => {
      if (result) {
        const classes = await StaticClassNames.find({});

        if (!classes) {
          return res.status(403).json({ err: 'Dont have any class ' });
        }
        return res.status(200).json({ classes: classes.reverse() });
      }
      return res.status(401).json({ err: 'Token not valid' });
    });
  } catch (error) {
    res.status(400).json({ error });
  }
};

exports.createClass = (req, res) => {
  try {
    verifyToken.checkToken(req.body.token, async (result, data) => {
      if (result) {
        const className = req.body.name;
        const isExist = await StaticClassNames.findOne({ className });
        if (!isExist) {
          const saveClass = new StaticClassNames({
            className,
          });
          const saveResult = await saveClass.save();

          if (saveResult != null) {
            // create collocation with default value
            await mongoose.connection.db.createCollection(className, (err) => {
              if (err) {
                return res.status(403).json({ err: 'Can not create a collection' });
              }
            });
            return res.status(200).json({ msg: 'Successfully created' });
          }
        }
        return res.status(406).json({ err: 'This class is exist' });
      }
      return res.status(401).json({ err: 'Token not valid' });
    });
  } catch (error) {
    res.status(400).json({ error });
  }
};

exports.deleteClass = (req, res) => {
  try {
    verifyToken.checkToken(req.body.token, async (result, data) => {
      if (result) {
        const classes = req.body.class;
        const isDeleted = await StaticClassNames.deleteOne({ _id: classes._id });

        if (isDeleted.deletedCount > 0) {
          // then delete collection from db
          const collection = await mongoose.connection.db.dropCollection(classes.className);

          if (collection) {
            return res.status(200).json({ msg: 'Successfully deleted' });
          }
        }
        return res.status(406).json({ err: 'Failed' });
      }
      return res.status(401).json({ err: 'Token not valid' });
    });
  } catch (error) {
    res.status(400).json({ error });
  }
};

exports.getColumn = (req, res) => {
  try {
    verifyToken.checkToken(req.query.token, async (result, data) => {
      if (result) {
        const collectionName = req.query.collectionName;
        const result = await StaticClassNames.findOne({ className: collectionName });
        if (!result) {
          return res.status(403).json({ err: 'Collection not exist' });
        }
        return res.status(200).json({ columns: result.columns });
      }
      return res.status(401).json({ err: 'Token not valid' });
    });
  } catch (error) {
    res.status(400).json({ error });
  }
};

exports.addColumn = (req, res) => {
  try {
    verifyToken.checkToken(req.body.token, async (result, data) => {
      if (result) {
        var column = {};
        const collection = req.body.collection;
        const columnName = req.body.columnName;
        const defaultValue = req.body.value;
        column.key = columnName;
        column.value = defaultValue;
        const isAddedToNames = await StaticClassNames.updateOne(
          { _id: collection._id },
          {
            $push: {
              columns: column,
            },
          }
        );

        StaticSchema.add({ [columnName]: defaultValue });

        const collectionObject = new StaticData(collection.className);
        const isAddedToCollection = await collectionObject.Custom.updateMany(
          {},
          { $set: { [columnName]: defaultValue } }
        );
        if (isAddedToNames && isAddedToCollection) {
          return res.status(200).json({ msg: 'Successfully Updated' });
        }
        return res.status(406).json({ err: 'Failed' });
      }
      return res.status(401).json({ err: 'Token not valid' });
    });
  } catch (error) {
    res.status(400).json({ error });
  }
};

exports.deleteColumn = (req, res) => {
  try {
    verifyToken.checkToken(req.body.token, async (result, data) => {
      if (result) {
        const collection = req.body.collection;
        const column = req.body.column;
        const isRemovedFromNames = await StaticClassNames.updateOne(
          { _id: collection._id },
          {
            $pull: {
              columns: column,
            },
          }
        );
        const collectionObject = new StaticData(collection.className);
        const isRemovedFromCollection = await collectionObject.Custom.updateMany(
          {},
          { $unset: { [column.key]: column.value } }
        );

        if (isRemovedFromNames.nModified === 1 && isRemovedFromCollection.nModified === 1) {
          return res.status(200).json({ msg: 'Successfully column deleted' });
        }
        return res.status(406).json({ err: 'Failed' });
      }
      return res.status(401).json({ err: 'Token not valid' });
    });
  } catch (error) {
    res.status(400).json({ error });
  }
};

exports.addRow = (req, res) => {
  try {
    verifyToken.checkToken(req.body.token, async (result, data) => {
      if (result) {
        var newRow = {};
        req.body.columns.forEach((element) => {
          StaticSchema.add({ [element.key]: {} });
          newRow = Object.assign({ [element.key]: element.value }, newRow);
        });

        const collection = new StaticData(req.body.collectionName);

        const newStatics = collection.Custom(newRow);
        const saveResult = await newStatics.save();

        if (saveResult != null) {
          return res.status(200).json({ msg: 'Successfully Created' });
        }
        return res.status(406).json({ err: 'Failed' });
      }
      return res.status(401).json({ err: 'Token not valid' });
    });
  } catch (error) {
    res.status(400).json({ error });
  }
};

exports.getRow = (req, res) => {
  try {
    verifyToken.checkToken(req.query.token, async (result, data) => {
      if (result) {
        const collection = new StaticData(req.query.collectionName);
        var rows = {};
        await collection.Custom.find({}).then((r) => {
          rows = r;
        });
        return res.status(200).json({ rows: rows });
      }
      return res.status(401).json({ err: 'Token not valid' });
    });
  } catch (error) {
    res.status(400).json({ error });
  }
};

exports.updateRow = (req, res) => {
  try {
    verifyToken.checkToken(req.body.token, async (result, data) => {
      if (result) {
        const collectionName = req.body.collectionName;
        const rowId = req.body.rowId;
        const columnName = req.body.columnName;
        const value = req.body.value;

        StaticSchema.add({ [columnName]: { type: columnType(value) } });

        const collectionObject = new StaticData(collectionName);
        const isUpdateRow = await collectionObject.Custom.updateMany(
          { _id: rowId },
          { $set: { [columnName]: convertValueToType(value) } }
        );

        if (isUpdateRow) {
          return res.status(200).json({ msg: 'Successfully Updated' });
        }
        return res.status(406).json({ err: 'Failed' });
      }
      return res.status(401).json({ err: 'Token not valid' });
    });
  } catch (error) {
    res.status(400).json({ error });
  }
};

exports.deleteRow = (req, res) => {
  try {
    verifyToken.checkToken(req.body.token, async (result, data) => {
      if (result) {
        const collectionName = req.body.collectionName;
        const rows = req.body.rows;

        const collectionObject = new StaticData(collectionName);
        const isDeleted = await collectionObject.Custom.deleteMany({ _id: { $in: rows } });

        if (isDeleted.deletedCount > 0) {
          return res.status(200).json({ msg: 'Successfully deleted' });
        }
        return res.status(406).json({ err: 'Failed' });
      }
      return res.status(401).json({ err: 'Token not valid' });
    });
  } catch (error) {
    res.status(400).json({ error });
  }
};

function convertValueToType(value) {
  if (isNaN(value)) {
    if (value == 'true') {
      return true;
    } else if (value == 'false') {
      return false;
    }
    return value;
  }
  return parseFloat(value);
}

function columnType(value) {
  if (isNaN(value)) {
    if (value == 'true' || value == 'false') {
      return Boolean;
    }
    return String;
  }
  return Number;
}
