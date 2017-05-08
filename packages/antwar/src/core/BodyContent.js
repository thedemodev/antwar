import React from 'react';
import { Route } from 'react-router';
import config from 'config'; // Aliased through webpack
import _ from 'lodash';
import PropTypes from 'prop-types';
import paths from './paths';

const BodyContent = ({ location }) => {
  const allPages = paths.getAllPages(config);
  const page = paths.getPageForPath(config, location.pathname, allPages);
  const section = getSection(page, location.pathname, allPages);

  return renderSection(
    page,
    { config, section, page, location },
    section
  );
};
BodyContent.propTypes = {
  location: PropTypes.object
};

function getSection(page, pathname, allPages) {
  const sectionName = page.section ? page.section : _.trim(pathname, '/');
  const section = config.paths[sectionName || '/'] || config.paths['/'] || {};

  section.title = section.title || sectionName;
  section.name = sectionName;

  // Get all pages of all sections
  section.all = () => getAllSectionPages(allPages);

  // Get pages of the current section or the named one
  section.pages = name => getSectionPages(config, name || sectionName, allPages);

  return section;
}

function getAllSectionPages(allPages) {
  return _.map(config.paths, (({ title }, name) => ({
    url: name,
    title,
    pages: getSectionPages(name, allPages)
  })));
}

function getSectionPages(config, name, allPages) {
  return _.filter(
    paths.getSectionPages(config, name, allPages),
    p => p.type === 'page'
  );
}

function renderSection(page, props, section) {
  let content;

  // TODO: It would be nice to handle redirects here during development
  if (page.type === 'index') {
    // Sections don't have page metadata
    content = React.createFactory(
      section.layouts ?
        section.layouts.index() :
        section.content() // Custom page
    )(props);
  } else if (page.type === 'page') {
    // Ok, got a page now. render it using a page template
    content = React.createFactory(
      section.layouts.page()
    )(
      props,
      React.createFactory(page, props)
    );
  } else if (page.type === 'custom') {
    // Custom page should render through content
    content = React.createFactory(
      page.section.content()
    )(props);
  } else {
    console.warn('Trying to render a page with an unknown type', page.type, page, props, section);
  }

  if (config.layout) {
    return React.createFactory(config.layout())(
      {},
      content
    );
  }

  return content;
}

export default () => (
  <Route exact strict component={BodyContent} />
);
