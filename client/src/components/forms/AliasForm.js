import React, { Component } from "react";
import { compose } from "redux";
import { connect } from "react-redux";
import { withRouter, Redirect } from "react-router-dom";
import PropTypes from "prop-types";

import TextField from "material-ui/TextField";
import Button from "material-ui/Button";
import Input, { InputLabel } from "material-ui/Input";
import { MenuItem } from "material-ui/Menu";
import { FormControl, FormControlLabel } from "material-ui/Form";
import Select from "material-ui/Select";
import Switch from "material-ui/Switch";
import { withStyles } from "material-ui/styles";
import Grid from "material-ui/Grid";
import { toast } from "react-toastify";

import { getAll } from "../../actions/data";
import { handleRequestError } from "../../util";

const styles = {
  textfield: {
    width: "100%"
  }
};

class AccountForm extends Component {
  state = {
    data: {
      source_username: "",
      source_domain: "",
      destination: "",
      enabled: true
    },
    error: "",
    submitting: false
  };

  async componentDidMount() {
    if (this.props.domains.length === 0) await this.props.getAll();
    if (this.props.domains.length > 0) {
      this.setState({
        data: {
          ...this.state.data,
          source_domain: this.props.domains[0].domain,
          source_username: !this.props.isAdmin ? this.props.username : ""
        }
      });
    }

    const { id } = this.props.match.params;
    const alias = this.props.aliases.find(alias => alias.id === +id);

    if (alias) {
      this.setState({
        data: {
          ...this.state.data,
          source_username: alias.source_username,
          source_domain: alias.source_domain,
          destination: `${alias.destination_username}@${alias.destination_domain}`,
          enabled: alias.enabled === "1"
        }
      });
    }
  }

  handleChange = e => {
    this.setState({
      data: { ...this.state.data, [e.target.name]: e.target.value }
    });
  };

  handleChangeSelect = e => {
    this.setState({
      data: { ...this.state.data, source_domain: e.target.value }
    });
  };

  handleSubmit = e => {
    e.preventDefault();
    this.setState({ submitting: true });

    const {
      source_username,
      source_domain,
      enabled,
      destination
    } = this.state.data;
    const [destination_username, destination_domain] = destination.split("@");

    this.props
      .submit({
        source_username,
        source_domain,
        destination_username,
        destination_domain,
        enabled
      })
      .then(data => {
        if (this.props.update) {
          toast.success("Updated successfully 💥");
          this.setState({
            submitting: false
          });
        } else {
          toast.success("Saved successfully 💥");
          this.setState({
            data: {
              ...this.state.data,
              source_username: "",
              destination: "",
              enabled: true
            },
            submitting: false
          });
        }
      })
      .catch(error => {
        const { message } = handleRequestError(error);
        toast.error("Error: " + message);
        this.setState({
          submitting: false
        });
      });
  };

  render() {
    const {
      source_username,
      source_domain,
      destination,
      enabled
    } = this.state.data;
    const { update, classes, isAdmin, username, aliases } = this.props;
    const exists = !!aliases.find(
      alias => alias.id === +this.props.match.params.id
    );

    if (update && !isAdmin && !exists) {
      return (
        <Redirect
          to={{
            pathname: "/"
          }}
        />
      );
    }

    return (
      <form onSubmit={this.handleSubmit}>
        <Grid container>
          <Grid item xs={12}>
            <TextField
              id="username"
              label="Username"
              name="source_username"
              placeholder="user"
              value={isAdmin ? source_username : username}
              onChange={this.handleChange}
              margin="normal"
              className={classes.textfield}
              disabled={!isAdmin}
            />
          </Grid>
          <Grid item xs={12}>
            <FormControl className={classes.textfield}>
              <InputLabel htmlFor="domains">Domain</InputLabel>
              <Select
                name="source_domain"
                value={source_domain}
                onChange={this.handleChangeSelect}
                input={<Input id="domains" />}
                disabled={!isAdmin}
              >
                {this.props.domains.map(domain => (
                  <MenuItem key={domain.id} value={domain.domain}>
                    {domain.domain}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12}>
            <TextField
              id="destination"
              label="Destination Email"
              name="destination"
              type="email"
              value={destination}
              onChange={this.handleChange}
              margin="normal"
              className={classes.textfield}
            />
          </Grid>
          <Grid item xs={12}>
            <FormControlLabel
              control={
                <Switch
                  checked={enabled}
                  onChange={(event, checked) =>
                    this.setState({
                      data: { ...this.state.data, enabled: checked }
                    })}
                />
              }
              label="Enabled"
            />
          </Grid>
          <Grid item xs={12}>
            <Button
              raised
              color="accent"
              type="submit"
              disabled={this.state.submitting}
            >
              {update ? "Update Alias" : "Save Alias"}
            </Button>
          </Grid>
          <Grid item xs={12}>
            {this.state.error}
          </Grid>
        </Grid>
      </form>
    );
  }
}

AccountForm.propTypes = {
  domain: PropTypes.string,
  update: PropTypes.bool
};

AccountForm.defaultProps = {
  domain: "",
  update: false
};

const mapStateToProps = state => ({
  isAdmin: state.authentication.admin,
  username: state.authentication.email.split("@")[0],
  domain: state.authentication.email.split("@")[1],
  domains: state.data.domains,
  aliases: state.data.aliases
});

const enhance = compose(
  withStyles(styles),
  withRouter,
  connect(mapStateToProps, { getAll })
);

export default enhance(AccountForm);
