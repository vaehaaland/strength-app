/* eslint-disable @typescript-eslint/no-require-imports */
const express = require('express');
const cors = require('cors');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const { promisify } = require('util');
