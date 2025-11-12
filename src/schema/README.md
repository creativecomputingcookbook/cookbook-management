# Schema

This establishes a format that describes what is needed on each page. Essentially each schema file is a list of field descriptions.

## General properties

* `id`: a unique identifier for each field.
* `name`: name of the field used on the form.
* `description`: description of the field used on the form, serving as a hint for users.
* `type`: type of the field. See below.
* `extra_inputs`: a list of additional fields that should be asked in the same component. This should be a list of fields and should be asked *before* the main input of that field.
* `extra_properties`: an object that should be appended to the field's input before uploading it to the database.
* `binding`: the object key for the input.

## Types

### `hidden`

A placeholder field that contains no inputs. Should be combined with an `extra_properties` property.

### `text`

Text.

### `image`

Image. Should allow upload.

### `iframe`

IFrame. Should ask for the frame source.

The `transform` property is intended to validate the URL. Three possible transforms:

* `"youtube"` should check for YouTube iFrame link.
* `"makecode"` should check for Makecode editor link.
* `"arduino"` should check for Arduino embed link.

### `open_field_list`

An open field list. That is, there is no limit to the number of sub-fields there are, as long as each field corresponds to a schema within `choices`.