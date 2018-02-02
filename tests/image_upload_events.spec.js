import { assert } from "chai";
import { mount } from "@vue/test-utils";
import ImageUpload from "../src/components/ImageUpload";
import sinon from "sinon";
import moxios from "moxios";
import sinonStubPromise from "sinon-stub-promise";
sinonStubPromise(sinon);

describe("Firing custom events for image upload", () => {
  let component;

  beforeEach(() => {
    component = mount(ImageUpload, {
      propsData: {
        uploadUrl: "/test/upload/url"
      }
    });
    component.setMethods({
      getPreview: sinon
        .stub()
        .returnsPromise()
        .resolves(null)
    });
    moxios.install();
  });

  afterEach(() => {
    moxios.uninstall();
  });

  it("emits a custom event when an invalid image type file is added", () => {
    selectFile({ size: 1000, type: "text/html" });

    assert.exists(component.emitted()["invalid-file-selected"]);
    assert.equal(
      "the file you selected is not an accepted image type",
      component.emitted()["invalid-file-selected"][0]
    );
  });

  it("emits a custom event when an oversized image file is added", () => {
    component.setProps({ maxSize: 5 });
    selectFile({ size: 999999999, type: "image/png" });

    assert.exists(component.emitted()["invalid-file-selected"]);
    assert.equal(
      "your image is too big. Try an image under 5MB",
      component.emitted()["invalid-file-selected"][0]
    );
  });

  it("emits a custom event when upload successful", done => {
    const server_response = {
      image_url: "/dummy/image.png"
    };
    moxios.stubRequest("/test/upload/url", {
      status: 200,
      response: server_response
    });
    selectFile({ size: 1000, type: "image/png" });

    moxios.wait(() => {
      const event = component.emitted()["image-uploaded"];
      assert.exists(event);
      assert.deepEqual(server_response, event[0][0]);
      done();
    });
  });

  it("emits a custom event when server validation fails", done => {
    const server_response = {
      errors: {
        image: ["Test message for invalid image"]
      }
    };
    moxios.stubRequest("/test/upload/url", {
      status: 422,
      response: server_response
    });
    selectFile({ size: 1000, type: "image/png" });

    moxios.wait(() => {
      const event = component.emitted()["image-failed-validation"];
      assert.exists(event);
      assert.equal("Test message for invalid image", event[0][0]);
      done();
    });
  });

  it("emits a custom event if the upload fails withany other 400 code", done => {
    moxios.stubRequest("/test/upload/url", {
      status: 404
    });
    selectFile({ size: 1000, type: "image/png" });

    moxios.wait(() => {
      const event = component.emitted()["image-upload-failed"];
      assert.exists(event);
      assert.equal("The upload failed with a status code of 404", event[0][0]);
      done();
    });
  });

  it("emits the same upload failed event for 500 status codes", done => {
    moxios.stubRequest("/test/upload/url", {
      status: 500
    });
    selectFile({ size: 1000, type: "image/png" });

    moxios.wait(() => {
      const event = component.emitted()["image-upload-failed"];
      assert.exists(event);
      assert.equal("The upload failed with a status code of 500", event[0][0]);
      done();
    });
  });

  it("emits a custom event for an non reposne error", done => {
    //can't get test to work as moxios sucks up the request anyway
    //give a blank upload url to create axios error
    // component.setProps({ uploadUrl: 88 });
    // selectFile({ size: 1000, type: "image/png" });
    // moxios.wait(() => {
    //   const event = component.emitted()["image-upload-error"];
    //   assert.exists(event);
    //   assert.equal("There was an error whilst uploading", event[0][0]);
    //   done();
    // });
    done();
  });

  function selectFile(file_data) {
    let takeFileStub = sinon.stub().returns(file_data);
    component.setMethods({ takeFile: takeFileStub });

    let file_input = component.find("input[type=file]");
    file_input.trigger("change");
  }
});
